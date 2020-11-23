import { SignedTransaction, TransactionConfig } from "web3-core";
import { AbiItem } from "web3-utils";

// Test variables
export const GENESIS_ACCOUNT = "0x6be02d1d3665660d22ff9624b7be0551ee1ac91b";
export const GENESIS_ACCOUNT_PRIVATE_KEY =
  "0x99B3C12287537E38C90A9219D4CB074A89A16E9CDB20BF85728EBD97C343E342";
export const TEST_ACCOUNT = "0x1111111111111111111111111111111111111111";

// Solidity: contract test {function multiply(uint a) public pure returns(uint d) {return a * 7;}}
export const TEST_CONTRACT_BYTECODE =
  "0x6080604052348015600f57600080fd5b5060ae8061001e6000396000f3fe6080604052348015600f57600080fd" +
  "5b506004361060285760003560e01c8063c6888fa114602d575b600080fd5b605660048036036020811015604157" +
  "600080fd5b8101908080359060200190929190505050606c565b6040518082815260200191505060405180910390" +
  "f35b600060078202905091905056fea265627a7a72315820f06085b229f27f9ad48b2ff3dd9714350c1698a37853" +
  "a30136fa6c5a7762af7364736f6c63430005110032";

export const TEST_CONTRACT_ABI = {
  constant: true,
  inputs: [{ internalType: "uint256", name: "a", type: "uint256" }],
  name: "multiply",
  outputs: [{ internalType: "uint256", name: "d", type: "uint256" }],
  payable: false,
  stateMutability: "pure",
  type: "function",
} as AbiItem;

// Solidity: contract test {function infinite(uint a) public pure returns(uint d) {while (true) {}}}
export const INFINITE_CONTRACT_BYTECODE =
  "6080604052348015600f57600080fd5b5060788061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80635bec9e6714602d575b600080fd5b60336035565b005b5b6001156040576036565b56fea264697066735822122015c7d339c1118112e1d9b33ea79ded52efa22f4e3cefe34097578a63e128f8a264736f6c63430007040033";

export const INFINITE_CONTRACT_ABI = {
  inputs: [],
  name: "infinite",
  outputs: [],
  stateMutability: "pure",
  type: "function",
} as AbiItem;

export const FIRST_CONTRACT_ADDRESS = "0xc2bf5f29a4384b1ab0c063e1c666f02121b6084a";

// +++ TransactionConfig +++

export const basicTransfertx: TransactionConfig = {
  from: GENESIS_ACCOUNT,
  to: TEST_ACCOUNT,
  value: "0x200", // =512 Must me higher than ExistentialDeposit (500)
  gasPrice: "0x01",
  gas: "0x100000",
};
export const contractCreation: TransactionConfig = {
  from: GENESIS_ACCOUNT,
  data: TEST_CONTRACT_BYTECODE,
  value: "0x00",
  gasPrice: "0x01",
  gas: "0x100000",
};
