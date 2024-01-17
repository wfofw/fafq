console.time('Code');
const solana = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const bs58 = require('bs58');
const { Wallet } = require('@project-serum/anchor');
const lodash = require('lodash');
require('dotenv').config({ path: 'E:/lrnng3.0/code/JUPsoft/data.env' });

const privateKey = process.env.privateKey;
const url = process.env.rpcNode;
const connection = new solana.Connection(url, 'confirmed');

const keypair = solana.Keypair.fromSecretKey(bs58.decode(privateKey));
const wallet = new Wallet(keypair);

const inputMint = 'So11111111111111111111111111111111111111112';
const outputMint = ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'];
const slippage = 50;

const swapping = async () => {
    let route;
    const solAmount = 0.00001;

    const solBalance = await connection.getBalance(keypair.publicKey)/solana.LAMPORTS_PER_SOL;
    console.log('SOL Balance:', solBalance);
    if (solBalance < 0.001) {
        route = `https://quote-api.jup.ag/v6/quote?inputMint=${'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'}`+
                `&outputMint=${lodash.sample(outputMint)}`+
                `&amount=${solAmount*solana.LAMPORTS_PER_SOL}`+
                `&slippageBps=${slippage}`;
    } else {
        route = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}`+
                `&outputMint=${lodash.sample(outputMint)}`+
                `&amount=${solAmount*solana.LAMPORTS_PER_SOL}`+
                `&slippageBps=${slippage}`;
    }
    
    //console.log(route);
    const quoteResponse = await(await(fetch(route))).json();
    //console.log(quoteResponse);

    const swapTransaction = await(
        await(fetch('https://quote-api.jup.ag/v6/swap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // quoteResponse from /quote api
            quoteResponse,
            // user public key to be used for the swap
            userPublicKey: wallet.publicKey.toString(),
            // auto wrap and unwrap SOL. default is true
            wrapAndUnwrapSol: true,
            // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
            // feeAccount: "fee_account_public_key"
          })
        }))
    ).json();
    //console.log(swapTransaction);
    const blockhash = (await connection.getLatestBlockhash()).blockhash;
    const swapTransactionBuf = Buffer.from(swapTransaction.swapTransaction, 'base64');
    let transaction = solana.VersionedTransaction.deserialize(swapTransactionBuf);
    //console.log(transaction);

    // sign the transaction
    transaction.sign([keypair]);

    const rawTransaction = transaction.serialize()
    //const txSend = await connection.sendRawTransaction(rawTransaction);
    const txSend = await connection.sendRawTransaction(rawTransaction, {skipPreflight: true, maxRetries: 2});
    await connection.confirmTransaction(txSend, 'finalized2');
    //console.log(txSend);
    //await connection.confirmTransaction();
    console.log(`https://solscan.io/tx/${txSend}`);
};

const txAmount = 5;
let timeDelay = 0;

(async () => {
    for(let i = 0;i!=txAmount;i++) {
        timeDelay += lodash.random(30000, 60000);
        console.log(lodash.round(timeDelay/60000, 2));
        setTimeout(swapping, timeDelay);
    }
})();

console.log('--------------------------------------\n'+'Code will end in: '+
            Math.floor(timeDelay/60000)+' minute '+Math.floor(60*(timeDelay/60000%1))+' second\n'+
            '--------------------------------------\n');