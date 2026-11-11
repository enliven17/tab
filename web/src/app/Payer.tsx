import { useEffect, useState } from "react";
import { isAddress, type Address } from "viem";
import type { Session } from "./App.tsx";
import { encode, tokenAbi, typedData, type Authorization } from "../tab.ts";
import { amount, chain, money, reader, send, signTypedData, SYMBOL, tab, token } from "../wallet.ts";

const OPEN_WINDOW = 15n * 60n;

function randomNonce(): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return bytes.reduce((n, b) => (n << 8n) | BigInt(b), 0n);
}

export function Payer({ session, onSigned }: { session: Session; onSigned: (code: string) => void }) {
  const { account, tick, busy, run } = session;
  const [balance, setBalance] = useState<bigint>();
  const [merchant, setMerchant] = useState("");
  const [limit, setLimit] = useState("25");
  const [minutes, setMinutes] = useState("60");

  useEffect(() => {
    if (!account) return setBalance(undefined);
    reader
      .readContract({ address: token, abi: tokenAbi, functionName: "balanceOf", args: [account] })
      .then(setBalance, () => setBalance(undefined));
  }, [account, tick]);

  const value = amount(limit);
  const window = /^\d+$/.test(minutes) && Number(minutes) > 0 ? BigInt(minutes) * 60n : undefined;
  const ready = account && isAddress(merchant) && value && window;

  const mint = () =>
    run(`Minting 100 ${SYMBOL}`, () =>
      send(account!, {
        address: token,
        abi: tokenAbi,
        functionName: "mint",
        args: [account, amount("100")],
      }),
    );

  const sign = () =>
    run("Signing the authorization", async () => {
      const allowance = await reader.readContract({
        address: token,
        abi: tokenAbi,
        functionName: "allowance",
        args: [account!, tab],
      });
      if (allowance < value!) {
        await send(account!, {
          address: token,
          abi: tokenAbi,
          functionName: "approve",
          args: [tab, value],
        });
      }
      const now = BigInt(Math.floor(Date.now() / 1000));
      const message: Authorization = {
        payer: account!,
        merchant: merchant as Address,
        token,
        limit: value!,
        openBy: now + OPEN_WINDOW,
        captureBy: now + window!,
        nonce: randomNonce(),
      };
      const signature = await signTypedData(account!, typedData(chain.id, tab, message));
      onSigned(encode({ ...message, signature }));
    });

  return (
    <article className="slip">
      <div className="paper">
        <h2>
          <span>01</span> Payer
        </h2>
        <p className="hint">Sign once. Nothing moves until the merchant opens the tab.</p>

        <dl className="lines">
          <div>
            <dt>Balance</dt>
            <dd>{balance === undefined ? "—" : `${money(balance)} ${SYMBOL}`}</dd>
          </div>
        </dl>
        <button className="ghost wide" disabled={!account || busy} onClick={mint}>
          Mint 100 test {SYMBOL}
        </button>

        <label>
          Merchant address
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value.trim())}
            placeholder="0x…"
            spellCheck={false}
          />
        </label>
        <div className="pair">
          <label>
            Limit ({SYMBOL})
            <input value={limit} onChange={(e) => setLimit(e.target.value)} inputMode="decimal" />
          </label>
          <label>
            Window (min)
            <input
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              inputMode="numeric"
            />
          </label>
        </div>

        <button className="wide" disabled={!ready || busy} onClick={sign}>
          Approve and sign
        </button>
        {!account && <p className="hint">Connect a wallet to sign.</p>}
      </div>
    </article>
  );
}
