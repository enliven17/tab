import { useEffect, useState } from "react";
import type { Address } from "viem";
import { Merchant } from "./Merchant.tsx";
import { Payer } from "./Payer.tsx";
import { Receipt } from "./Receipt.tsx";
import { chain, connect, reason, short, tab } from "./wallet.ts";

/** What every panel needs: the connected account and a way to run a step. */
export type Session = {
  account?: Address;
  tick: number;
  busy: boolean;
  run: (label: string, work: () => Promise<void>) => Promise<void>;
};

const params = new URLSearchParams(location.hash.slice(1));

export function App() {
  const [account, setAccount] = useState<Address>();
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; bad?: boolean }>();
  const [code, setCode] = useState(params.get("a") ?? "");
  const [id, setId] = useState<bigint | undefined>(() => {
    try {
      return params.get("tab") ? BigInt(params.get("tab")!) : undefined;
    } catch {
      return undefined;
    }
  });

  const run: Session["run"] = async (label, work) => {
    setBusy(true);
    setNotice({ text: `${label}…` });
    try {
      await work();
      setNotice({ text: `${label}: done` });
    } catch (error) {
      setNotice({ text: reason(error), bad: true });
    } finally {
      setBusy(false);
      setTick((t) => t + 1);
    }
  };

  useEffect(() => {
    const changed = (accounts: Address[]) => setAccount(accounts[0]);
    window.ethereum?.on("accountsChanged", changed);
    return () => window.ethereum?.removeListener("accountsChanged", changed);
  }, []);

  useEffect(() => {
    if (id !== undefined) history.replaceState(null, "", `#tab=0x${id.toString(16)}`);
  }, [id]);

  const session: Session = { account, tick, busy, run };

  return (
    <>
      <header className="bar">
        <a className="mark" href="./" aria-label="Tab">
          <svg viewBox="0 0 28 32" aria-hidden="true">
            <path d="M2 1h24v27l-4 3-4-3-4 3-4-3-4 3-4-3z" />
            <path className="cut" d="M8 9h12M8 15h12M8 21h7" />
          </svg>
          TAB
        </a>
        <span className="meta">
          {chain.name} · {short(tab)}
        </span>
        <button
          className="ghost"
          disabled={busy}
          onClick={() => run("Connecting", async () => setAccount(await connect()))}
        >
          {account ? short(account) : "Connect wallet"}
        </button>
      </header>

      <section className="intro">
        <h1>Open a tab. Charge what was used. Return the rest.</h1>
        <p>
          One signature authorizes a limit. The merchant charges it in parts, and whatever is not
          charged goes back to the payer. The escrow contract is written in Fe.
        </p>
      </section>

      {notice && (
        <p className={notice.bad ? "notice bad" : "notice"} role="status">
          {notice.text}
        </p>
      )}

      <main className="desk">
        <Payer session={session} onSigned={setCode} />
        <Merchant session={session} code={code} onCode={setCode} onOpened={setId} />
        <Receipt session={session} id={id} onId={setId} />
      </main>

      <footer className="foot">
        Demo deployment with a valueless test token. Not audited.{" "}
        <a href="https://github.com/enliven17/tab">Source</a>
      </footer>
    </>
  );
}
