import { useEffect, useState } from "react";
import { isAddressEqual, zeroAddress, type Address } from "viem";
import type { Session } from "./App.tsx";
import { tabAbi, tokenAbi } from "../tab.ts";
import { amount, clock, money, reader, send, short, SYMBOL, tab, token } from "../wallet.ts";

type State = {
  payer: Address;
  merchant: Address;
  captureBy: bigint;
  held: bigint;
  charged: bigint;
  refunded: bigint;
  now: bigint;
};

async function load(id: bigint): Promise<State | undefined> {
  const call = { address: tab, abi: tabAbi, args: [id] } as const;
  const [terms, held, charged, refunded, block] = await Promise.all([
    reader.readContract({ ...call, functionName: "terms" }),
    reader.readContract({ ...call, functionName: "held" }),
    reader.readContract({ ...call, functionName: "charged" }),
    reader.readContract({ ...call, functionName: "refunded" }),
    reader.getBlock(),
  ]);
  if (terms[0] === zeroAddress) return undefined;
  return {
    payer: terms[0],
    merchant: terms[1],
    captureBy: terms[3],
    held,
    charged,
    refunded,
    now: block.timestamp,
  };
}

export function Receipt({
  session,
  id,
  onId,
}: {
  session: Session;
  id?: bigint;
  onId: (id: bigint) => void;
}) {
  const { account, tick, busy, run } = session;
  const [state, setState] = useState<State>();
  const [lookup, setLookup] = useState("");
  const [chargeText, setChargeText] = useState("");
  const [refundText, setRefundText] = useState("");

  useEffect(() => {
    if (id === undefined) return setState(undefined);
    load(id).then(setState, () => setState(undefined));
  }, [id, tick]);

  const find = () => {
    try {
      onId(BigInt(lookup.trim()));
    } catch {
      /* not a number: ignore */
    }
  };

  if (id === undefined || !state) {
    return (
      <article className="slip">
        <div className="paper">
          <h2>
            <span>03</span> The tab
          </h2>
          <p className="hint">
            {id === undefined ? "Open a tab or look one up by id." : "No tab with this id yet."}
          </p>
          <label>
            Tab id
            <input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
            />
          </label>
          <button className="ghost wide" onClick={find}>
            Look up
          </button>
        </div>
      </article>
    );
  }

  const expired = state.now > state.captureBy;
  const status = state.held === 0n ? "Closed" : expired ? "Expired" : "Open";
  const isMerchant = account !== undefined && isAddressEqual(account, state.merchant);
  const charge = amount(chargeText);
  const refund = amount(refundText);
  const call = { address: tab, abi: tabAbi } as const;

  const doRefund = () =>
    run("Refunding", async () => {
      const allowance = await reader.readContract({
        address: token,
        abi: tokenAbi,
        functionName: "allowance",
        args: [account!, tab],
      });
      if (allowance < refund!) {
        await send(account!, {
          address: token,
          abi: tokenAbi,
          functionName: "approve",
          args: [tab, refund],
        });
      }
      await send(account!, { ...call, functionName: "refund", args: [id, refund] });
      setRefundText("");
    });

  return (
    <article className="slip">
      <div className="paper">
        <h2>
          <span>03</span> The tab
          <em className={`stamp ${status.toLowerCase()}`}>{status}</em>
        </h2>
        <p className="hint">No. {short(`0x${id.toString(16).padStart(64, "0")}`)}</p>

        <dl className="lines">
          <div>
            <dt>Payer</dt>
            <dd>{short(state.payer)}</dd>
          </div>
          <div>
            <dt>Merchant</dt>
            <dd>{short(state.merchant)}</dd>
          </div>
          <div>
            <dt>Capture by</dt>
            <dd>{clock(state.captureBy)}</dd>
          </div>
        </dl>
        <dl className="lines sum">
          <div>
            <dt>Charged</dt>
            <dd>{money(state.charged)}</dd>
          </div>
          <div>
            <dt>Refunded</dt>
            <dd>−{money(state.refunded)}</dd>
          </div>
          <div className="total">
            <dt>Still held</dt>
            <dd>
              {money(state.held)} {SYMBOL}
            </dd>
          </div>
        </dl>

        {isMerchant && state.held > 0n && !expired && (
          <div className="action">
            <input
              value={chargeText}
              onChange={(e) => setChargeText(e.target.value)}
              placeholder="Amount"
              inputMode="decimal"
              aria-label="Amount to charge"
            />
            <button
              disabled={!charge || busy}
              onClick={() =>
                run("Charging", async () => {
                  await send(account!, { ...call, functionName: "charge", args: [id, charge] });
                  setChargeText("");
                })
              }
            >
              Charge
            </button>
          </div>
        )}
        {isMerchant && state.held > 0n && (
          <button
            className="ghost wide"
            disabled={busy}
            onClick={() =>
              run("Closing the tab", () =>
                send(account!, { ...call, functionName: "close", args: [id] }),
              )
            }
          >
            Close and return {money(state.held)}
          </button>
        )}
        {isMerchant && state.charged > state.refunded && (
          <div className="action">
            <input
              value={refundText}
              onChange={(e) => setRefundText(e.target.value)}
              placeholder="Amount"
              inputMode="decimal"
              aria-label="Amount to refund"
            />
            <button className="ghost" disabled={!refund || busy} onClick={doRefund}>
              Refund
            </button>
          </div>
        )}
        {expired && state.held > 0n && (
          <button
            className="wide"
            disabled={!account || busy}
            onClick={() =>
              run("Returning the remainder", () =>
                send(account!, { ...call, functionName: "reclaim", args: [id] }),
              )
            }
          >
            Reclaim {money(state.held)} to the payer
          </button>
        )}
        {!isMerchant && !expired && state.held > 0n && (
          <p className="hint">Connect as the merchant to charge or close this tab.</p>
        )}
      </div>
    </article>
  );
}
