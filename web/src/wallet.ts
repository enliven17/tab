import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  custom,
  formatUnits,
  http,
  parseUnits,
  type Address,
  type EIP1193Provider,
} from "viem";
import { anvil, sepolia } from "viem/chains";
import deployment from "./deployment.json";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export const chain = [anvil, sepolia].find((c) => c.id === deployment.chainId) ?? anvil;
export const tab = deployment.tab as Address;
export const token = deployment.token as Address;
export const DECIMALS = 6;
export const SYMBOL = "tUSD";

/** Reads go through the chain's public RPC, so the page works before connecting. */
export const reader = createPublicClient({ chain, transport: http() });

export async function connect(): Promise<Address> {
  if (!window.ethereum) throw new Error("No wallet found. Install MetaMask or another EVM wallet.");
  const wallet = createWalletClient({ chain, transport: custom(window.ethereum) });
  const [account] = await wallet.requestAddresses();
  try {
    await wallet.switchChain({ id: chain.id });
  } catch {
    await wallet.addChain({ chain });
  }
  return account;
}

/** Simulates a contract call, sends it from the wallet and waits for the receipt. */
export async function send(account: Address, request: object) {
  const wallet = createWalletClient({ chain, transport: custom(window.ethereum!) });
  const { request: checked } = await reader.simulateContract({ ...request, account } as never);
  const hash = await wallet.writeContract(checked as never);
  const receipt = await reader.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("Transaction reverted");
}

export async function signTypedData(account: Address, data: object) {
  const wallet = createWalletClient({ chain, transport: custom(window.ethereum!) });
  return wallet.signTypedData({ ...data, account } as never);
}

const REASONS: Record<string, string> = {
  Expired: "The deadline for this step has passed.",
  NotExpired: "The capture window is still open.",
  ZeroAmount: "Nothing to move.",
  NoMerchant: "The authorization has no merchant.",
  AlreadyOpen: "This authorization already opened a tab.",
  BadSignature: "The signature does not match these terms.",
  NotMerchant: "Only the merchant of this tab can do that.",
  ExceedsHeld: "That is more than the tab still holds.",
  ExceedsCharged: "That is more than was charged.",
};

/** A short, readable reason for a failed call. */
export function reason(error: unknown): string {
  if (error instanceof BaseError) {
    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError && revert.data?.errorName) {
      return REASONS[revert.data.errorName] ?? revert.data.errorName;
    }
    return error.shortMessage;
  }
  return error instanceof Error ? error.message : String(error);
}

export const money = (value: bigint) =>
  Number(formatUnits(value, DECIMALS)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

/** Parses a user-typed amount; returns undefined when it is not a positive number. */
export function amount(text: string): bigint | undefined {
  if (!/^\d+(\.\d{1,6})?$/.test(text.trim())) return undefined;
  const value = parseUnits(text.trim(), DECIMALS);
  return value > 0n ? value : undefined;
}

export const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

export const clock = (seconds: bigint) =>
  new Date(Number(seconds) * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
