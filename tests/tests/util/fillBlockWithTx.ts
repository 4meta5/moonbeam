import Web3 from "web3";

import { JsonRpcResponse } from "web3-core-helpers";
import { SignedTransaction, TransactionConfig } from "web3-core";
import { basicTransfertx, GENESIS_ACCOUNT, GENESIS_ACCOUNT_PRIVATE_KEY } from "../constants";
import { createAndFinalizeBlock, wrappedCustomRequest } from "./web3Requests";

function isSignedTransaction(tx: Error | SignedTransaction): tx is SignedTransaction {
  return (tx as SignedTransaction).rawTransaction !== undefined;
}
function isJsonRpcResponse(res: Error | JsonRpcResponse): res is JsonRpcResponse {
  return (res as JsonRpcResponse).jsonrpc !== undefined;
}

async function wrappedSignTx(
  web3: Web3,
  txConfig: TransactionConfig,
  privateKey: string
): Promise<SignedTransaction | Error> {
  try {
    let tx = await web3.eth.accounts.signTransaction(txConfig, privateKey);
    return tx;
  } catch (e) {
    //reportError(e, "signing");
    return new Error(e.toString());
  }
}

async function serialSignTx(
  web3: Web3,
  n: number,
  startingNonce: number,
  customTxConfig: TransactionConfig
): Promise<(Error | SignedTransaction)[]> {
  const resArray = [];
  for (let index = 0; index < n; index++) {
    resArray.push(
      await wrappedSignTx(
        web3,
        { ...customTxConfig, nonce: startingNonce + index },
        GENESIS_ACCOUNT_PRIVATE_KEY
      )
    );
  }
  return resArray;
}

async function serialSendTx(
  web3: Web3,
  n: number,
  _txList: (Error | SignedTransaction)[]
): Promise<(Error | JsonRpcResponse)[]> {
  const resArray = [];
  for (let index = 0; index < n; index++) {
    if (isSignedTransaction(_txList[index])) {
      resArray.push(
        await wrappedCustomRequest(web3, "eth_sendRawTransaction", [
          (_txList[index] as SignedTransaction).rawTransaction,
        ])
      );
    } else {
      resArray.push(_txList[index] as Error);
    }
  }
  return resArray;
}

//TODO: add description and specify test
// expectations should be separated from fun and ddisplayed in test file
export async function fillBlockWithTx(
  context: { web3: Web3 },
  numberOfTx: number,
  customTxConfig: TransactionConfig = basicTransfertx
) {
  let nonce: number = await context.web3.eth.getTransactionCount(GENESIS_ACCOUNT);

  const numberArray = new Array(numberOfTx).fill(1);

  interface ErrorReport {
    [key: string]: {
      [key: string]: number;
    };
  }

  let errorReport: ErrorReport = {
    signing: {},
    customreq: {},
  };

  function reportError(e, domain: string) {
    let message: string = e.error ? e.error.message : e.message ? e.message : JSON.stringify(e);
    if (errorReport[domain][message]) {
      errorReport[domain][message] += 1;
    } else {
      errorReport[domain][message] = 1;
    }
  }

  const startSigningTime: number = Date.now();

  // First sign all transactions

  let txList: (Error | SignedTransaction)[] = await serialSignTx(
    context.web3,
    numberOfTx,
    nonce,
    customTxConfig
  );

  const endSigningTime: number = Date.now();

  console.log(
    "Time it took to sign " +
      txList.length +
      " tx is " +
      (endSigningTime - startSigningTime) / 1000 +
      " seconds"
  );

  const startSendingTime: number = Date.now();

  //Then, send them to the pool

  let respList: (Error | JsonRpcResponse)[] = await serialSendTx(context.web3, numberOfTx, txList);

  respList.forEach((res) => {
    if (isJsonRpcResponse(res) && res.error) {
      //@ts-ignore
      reportError(res.error, "customreq");
    } else if (!isJsonRpcResponse(res)) {
      reportError(res, "signing");
    }
  });

  const endSendingTime: number = Date.now();

  console.log(
    "Time it took to send " +
      respList.length +
      " tx is " +
      (endSendingTime - startSendingTime) / 1000 +
      " seconds"
  );

  console.log("Error Report : ", errorReport);

  await createAndFinalizeBlock(context.web3);

  let block = await context.web3.eth.getBlock("latest");
  let txPassed: number = block.transactions.length;
  console.log(
    "block.gasUsed",
    block.gasUsed,
    "block.number",
    block.number,
    "block.transactions.length",
    block.transactions.length
  );

  let i: number = 2;

  while (block.transactions.length !== 0) {
    await createAndFinalizeBlock(context.web3);

    block = await context.web3.eth.getBlock("latest");
    console.log(
      "following block, block" + i + ".gasUsed",
      block.gasUsed,
      "block" + i + ".number",
      block.number,
      "block" + i + ".transactions.length",
      block.transactions.length
    );
    txPassed += block.transactions.length;
    i += 1;
  }

  // await Promise.all(
  //   txList.map(async (tx, i) => {
  //     // send it
  //     if (isSignedTransaction(tx)) {
  //       try {
  //         console.log((tx as SignedTransaction).transactionHash); //return console.log(await context.web3.eth.getTransactionReceipt((tx as SignedTransaction).transactionHash))
  //       } catch (e) {
  //         console.log("gettxrceipt error", e);
  //       }
  //     }
  //   })
  // );
  console.log("tx   passed", txPassed);
  return txPassed;
}

//todo: test web3 limits and serial vs parallel
