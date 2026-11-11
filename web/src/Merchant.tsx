import { useMemo } from "react";
import { hashTypedData, hexToBigInt } from "viem";
import type { Session } from "./App.tsx";
import { decode, openArgs, tabAbi, typedData, type SignedAuthorization } from "./tab.ts";
import { chain, clock, money, send, short, SYMBOL, tab } from "./wallet.ts";

function parse(code: string): SignedAuthorization | undefined {
  try {
    return code.trim() ? decode(code) : undefined;
  } catch {
    return undefined;
  }
}

export function Merchant({
  session,
  code,
  onCode,
  onOpened,
}: {
  session: Session;
  code: string;
  onCode: (code: string) => void;
  onOpened: (id: bigint) => void;
}) {
  const { account, busy, run } = session;
  const signed = useMemo(() => parse(code), [code]);
  const id = signed && hexToBigInt(hashTypedData(typedData(chain.id, tab, signed)));

  const open = () =>
    run("Opening the tab", async () => {
      await send(account!, {
        address: tab,
        abi: tabAbi,
        functionName: "open",
        args: openArgs(signed!),
      });
      onOpened(id!);
    });

  const link = `${location.origin}${location.pathname}#a=${code.trim()}`;

  return (
    <article className="slip">
      <div className="paper">
        <h2>
          <span>02</span> Merchant
        </h2>
        <p className="hint">Paste the signed authorization and open the tab.</p>

        <label>
          Authorization
          <textarea
            value={code}
            onChange={(e) => onCode(e.target.value)}
            rows={4}
            spellCheck={false}
            placeholder="Signed authorization from the payer"
          />
        </label>

        {code.trim() && !signed && <p className="hint bad">This is not a valid authorization.</p>}

        {signed && (
          <>
            <dl className="lines">
              <div>
                <dt>Payer</dt>
                <dd>{short(signed.payer)}</dd>
              </div>
              <div>
                <dt>Merchant</dt>
                <dd>{short(signed.merchant)}</dd>
              </div>
              <div>
                <dt>Limit</dt>
                <dd>
                  {money(signed.limit)} {SYMBOL}
                </dd>
              </div>
              <div>
                <dt>Open by</dt>
                <dd>{clock(signed.openBy)}</dd>
              </div>
              <div>
                <dt>Capture by</dt>
                <dd>{clock(signed.captureBy)}</dd>
              </div>
            </dl>
            <button className="wide" disabled={!account || busy} onClick={open}>
              Open tab
            </button>
            <div className="pair">
              <button className="ghost" onClick={() => navigator.clipboard.writeText(link)}>
                Copy link
              </button>
              <button className="ghost" onClick={() => onOpened(id!)}>
                View tab
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
