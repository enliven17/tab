import { useEffect, useState } from "react";
import type { Address } from "viem";
import { Merchant } from "./Merchant.tsx";
import { Payer } from "./Payer.tsx";
import { Receipt } from "./Receipt.tsx";
import { Footer, Nav } from "../ui/Shell.tsx";
import { chain, connect, reason, short, tab } from "../wallet.ts";

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

  const stage = id !== undefined ? 3 : code.trim() ? 2 : 1;

  return (
    <>
      <Nav current="/app/">
        <button
          className="ghost"
          disabled={busy}
          onClick={() => run("Connecting", async () => setAccount(await connect()))}
        >
          {account ? short(account) : "Connect wallet"}
        </button>
      </Nav>

      <div className="wrap">
        <section className="intro">
          <h1>Run a tab, start to finish.</h1>
          <p>
            Use two accounts: one signs as the payer, the other opens and charges as the merchant.
            The token is a test token anyone can mint. Network: {chain.name}.
          </p>
          <ol className="rail">
            {["Sign", "Open", "Charge and settle"].map((label, index) => (
              <li key={label} className={index + 1 <= stage ? "on" : undefined}>
                <span>0{index + 1}</span> {label}
              </li>
            ))}
          </ol>
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
      </div>

      <Footer />
    </>
  );
}
