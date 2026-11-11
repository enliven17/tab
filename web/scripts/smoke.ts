// One-account check of a live deployment: the PRIVATE_KEY account signs as the
// payer and acts as the merchant. Opens a tab for 100, charges 42.5, closes it.
//
//   RPC_URL, PRIVATE_KEY   as for deploy.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createPublicClient,
  createWalletClient,
  hashTypedData,
  hexToBigInt,
  http,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { openArgs, tabAbi, tokenAbi, typedData, type Authorization } from "../src/tab.ts";

const { chainId, tab, token } = JSON.parse(
  readFileSync(new URL("../src/deployment.json", import.meta.url), "utf8"),
) as { chainId: number; tab: Address; token: Address };

const transport = http(process.env.RPC_URL);
const account = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);
const reader = createPublicClient({ transport });
const wallet = createWalletClient({ transport, account });

async function send(request: object) {
  const { request: checked } = await reader.simulateContract({ ...request, account } as never);
  const hash = await wallet.writeContract({ ...checked, chain: null } as never);
  const receipt = await reader.waitForTransactionReceipt({ hash, confirmations: 2 });
  assert.equal(receipt.status, "success");
  return hash;
}

assert.equal(await reader.getChainId(), chainId, "RPC_URL is not the deployed network");
const now = (await reader.getBlock()).timestamp;
const message: Authorization = {
  payer: account.address,
  merchant: account.address,
  token,
  limit: 100_000000n,
  openBy: now + 900n,
  captureBy: now + 3600n,
  nonce: now,
};

await send({ address: token, abi: tokenAbi, functionName: "mint", args: [account.address, message.limit] });
await send({ address: token, abi: tokenAbi, functionName: "approve", args: [tab, message.limit] });

const data = typedData(chainId, tab, message);
const signature = await account.signTypedData(data);
const id = hexToBigInt(hashTypedData(data));

const opened = await send({
  address: tab,
  abi: tabAbi,
  functionName: "open",
  args: openArgs({ ...message, signature }),
});
await send({ address: tab, abi: tabAbi, functionName: "charge", args: [id, 42_500000n] });
await send({ address: tab, abi: tabAbi, functionName: "close", args: [id] });

const read = (functionName: "held" | "charged") =>
  reader.readContract({ address: tab, abi: tabAbi, functionName, args: [id] });
assert.equal(await read("held"), 0n);
assert.equal(await read("charged"), 42_500000n);
console.log(`ok: tab 0x${id.toString(16)} opened in ${opened}, charged 42.5, closed`);
