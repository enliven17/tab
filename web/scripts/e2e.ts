// Runs the whole flow against the deployment in src/deployment.json on a local
// Anvil node: sign, open, charge, close, refund. Run `pnpm run deploy` first.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createPublicClient,
  createWalletClient,
  hashTypedData,
  hexToBigInt,
  http,
  type Address,
} from "viem";
import { mnemonicToAccount, type HDAccount } from "viem/accounts";
import {
  decode,
  encode,
  openArgs,
  tabAbi,
  termsArgs,
  tokenAbi,
  typedData,
  type Authorization,
} from "../src/tab.ts";

const deployment = JSON.parse(
  readFileSync(new URL("../src/deployment.json", import.meta.url), "utf8"),
) as { chainId: number; tab: Address; token: Address };
const { tab, token } = deployment;

const transport = http(process.env.RPC_URL ?? "http://127.0.0.1:8545");
const reader = createPublicClient({ transport });
// Anvil accounts 0 and 1.
const ANVIL_MNEMONIC = "test test test test test test test test test test test junk";
const payer = mnemonicToAccount(ANVIL_MNEMONIC, { addressIndex: 0 });
const merchant = mnemonicToAccount(ANVIL_MNEMONIC, { addressIndex: 1 });

async function send(account: HDAccount, request: object) {
  const wallet = createWalletClient({ transport, account });
  const { request: checked } = await reader.simulateContract({ ...request, account } as never);
  const hash = await wallet.writeContract({ ...checked, chain: null } as never);
  const receipt = await reader.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, "success");
}

const balance = (who: Address) =>
  reader.readContract({ address: token, abi: tokenAbi, functionName: "balanceOf", args: [who] });
const read = (functionName: "held" | "charged" | "refunded", id: bigint) =>
  reader.readContract({ address: tab, abi: tabAbi, functionName, args: [id] });

const now = (await reader.getBlock()).timestamp;
const message: Authorization = {
  payer: payer.address,
  merchant: merchant.address,
  token,
  limit: 100_000000n,
  openBy: now + 600n,
  captureBy: now + 3600n,
  nonce: now,
};
const payerBefore = await balance(payer.address);
const merchantBefore = await balance(merchant.address);

await send(payer, {
  address: token,
  abi: tokenAbi,
  functionName: "mint",
  args: [payer.address, message.limit],
});
await send(payer, {
  address: token,
  abi: tokenAbi,
  functionName: "approve",
  args: [tab, message.limit],
});

const data = typedData(deployment.chainId, tab, message);
const signature = await payer.signTypedData(data);
const id = hexToBigInt(hashTypedData(data));
assert.equal(
  await reader.readContract({
    address: tab,
    abi: tabAbi,
    functionName: "digest",
    args: termsArgs(message),
  }),
  id,
);

// The payer hands the merchant a string; the merchant opens the tab from it.
const received = decode(encode({ ...message, signature }));
await send(merchant, { address: tab, abi: tabAbi, functionName: "open", args: openArgs(received) });
assert.equal(await read("held", id), 100_000000n);
const terms = await reader.readContract({
  address: tab,
  abi: tabAbi,
  functionName: "terms",
  args: [id],
});
assert.equal(terms[0], payer.address);
assert.equal(terms[1], merchant.address);

await send(merchant, { address: tab, abi: tabAbi, functionName: "charge", args: [id, 30_000000n] });
await send(merchant, { address: tab, abi: tabAbi, functionName: "charge", args: [id, 12_500000n] });
await send(merchant, { address: tab, abi: tabAbi, functionName: "close", args: [id] });
assert.equal(await read("held", id), 0n);
assert.equal(await read("charged", id), 42_500000n);

await send(merchant, {
  address: token,
  abi: tokenAbi,
  functionName: "approve",
  args: [tab, 2_500000n],
});
await send(merchant, { address: tab, abi: tabAbi, functionName: "refund", args: [id, 2_500000n] });
assert.equal(await read("refunded", id), 2_500000n);

assert.equal((await balance(payer.address)) - payerBefore, 60_000000n);
assert.equal((await balance(merchant.address)) - merchantBefore, 40_000000n);
assert.equal(await balance(tab), 0n);

// A second open with the same authorization must fail.
await assert.rejects(
  reader.simulateContract({
    address: tab,
    abi: tabAbi,
    functionName: "open",
    args: openArgs(received),
    account: merchant,
  }),
  /AlreadyOpen/,
);
console.log("ok: opened, charged 42.5, closed, refunded 2.5");
