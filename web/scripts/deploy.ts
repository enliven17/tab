// Deploys Tab and DemoToken from ../out (run `fe build` first) and records the
// addresses in src/deployment.json.
//
//   RPC_URL      default http://127.0.0.1:8545
//   PRIVATE_KEY  default Anvil account 0
import { readFileSync, writeFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const ANVIL_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const transport = http(process.env.RPC_URL ?? "http://127.0.0.1:8545");
const account = privateKeyToAccount((process.env.PRIVATE_KEY ?? ANVIL_KEY) as Hex);
const reader = createPublicClient({ transport });
const wallet = createWalletClient({ transport, account });

async function deploy(name: string) {
  const code = readFileSync(new URL(`../../out/${name}.bin`, import.meta.url), "utf8").trim();
  const hash = await wallet.sendTransaction({ data: `0x${code.replace(/^0x/, "")}`, chain: null });
  const receipt = await reader.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success" || !receipt.contractAddress) {
    throw new Error(`${name} failed to deploy`);
  }
  return receipt.contractAddress;
}

const chainId = await reader.getChainId();
const tab = await deploy("Tab");
const token = await deploy("DemoToken");
const deployment = { chainId, tab, token };
writeFileSync(
  new URL("../src/deployment.json", import.meta.url),
  JSON.stringify(deployment, null, 2) + "\n",
);
console.log(deployment);
