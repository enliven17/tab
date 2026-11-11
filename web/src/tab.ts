import { parseAbi, type Address, type Hex } from "viem";

export const tabAbi = parseAbi([
  "function open(address payer, address merchant, address token, uint256 limit, uint256 openBy, uint256 captureBy, uint256 nonce, bytes signature) returns (uint256)",
  "function charge(uint256 id, uint256 amount)",
  "function close(uint256 id)",
  "function reclaim(uint256 id)",
  "function refund(uint256 id, uint256 amount)",
  "function digest(address payer, address merchant, address token, uint256 limit, uint256 openBy, uint256 captureBy, uint256 nonce) view returns (uint256)",
  "function terms(uint256 id) view returns (address payer, address merchant, address token, uint256 captureBy)",
  "function held(uint256 id) view returns (uint256)",
  "function charged(uint256 id) view returns (uint256)",
  "function refunded(uint256 id) view returns (uint256)",
  "error Expired()",
  "error NotExpired()",
  "error ZeroAmount()",
  "error NoMerchant()",
  "error AlreadyOpen()",
  "error BadSignature()",
  "error NotMerchant()",
  "error ExceedsHeld()",
  "error ExceedsCharged()",
]);

export const tokenAbi = parseAbi([
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
]);

export type Authorization = {
  payer: Address;
  merchant: Address;
  token: Address;
  limit: bigint;
  openBy: bigint;
  captureBy: bigint;
  nonce: bigint;
};

export type SignedAuthorization = Authorization & { signature: Hex };

/** EIP-712 typed data for an authorization, as wallets expect it. */
export function typedData(chainId: number, tab: Address, message: Authorization) {
  return {
    domain: { name: "Tab", version: "1", chainId, verifyingContract: tab },
    types: {
      Authorization: [
        { name: "payer", type: "address" },
        { name: "merchant", type: "address" },
        { name: "token", type: "address" },
        { name: "limit", type: "uint256" },
        { name: "openBy", type: "uint256" },
        { name: "captureBy", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    },
    primaryType: "Authorization",
    message,
  } as const;
}

export function termsArgs(a: Authorization) {
  return [a.payer, a.merchant, a.token, a.limit, a.openBy, a.captureBy, a.nonce] as const;
}

export function openArgs(a: SignedAuthorization) {
  return [...termsArgs(a), a.signature] as const;
}

/** A signed authorization as a URL-safe string the payer hands to the merchant. */
export function encode(a: SignedAuthorization): string {
  const json = JSON.stringify(a, (_, v) => (typeof v === "bigint" ? v.toString() : v));
  return btoa(json).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function decode(text: string): SignedAuthorization {
  const raw = JSON.parse(atob(text.trim().replaceAll("-", "+").replaceAll("_", "/")));
  return {
    payer: raw.payer,
    merchant: raw.merchant,
    token: raw.token,
    limit: BigInt(raw.limit),
    openBy: BigInt(raw.openBy),
    captureBy: BigInt(raw.captureBy),
    nonce: BigInt(raw.nonce),
    signature: raw.signature,
  };
}
