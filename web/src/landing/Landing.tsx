import { useReveal } from "../ui/motion.ts";
import { Footer, Nav, REPO } from "../ui/Shell.tsx";
import { Story } from "./Story.tsx";

const CHARGES = [
  { label: "espresso ×2", value: "7.00" },
  { label: "lunch", value: "24.50" },
  { label: "service", value: "11.00" },
];

/** The hero figure: a bill that prints itself, line by line. */
function PrintedBill() {
  return (
    <div className="printer" aria-hidden="true">
      <div className="slot" />
      <div className="feed">
        <div className="slip">
          <div className="paper bill">
            <div className="row head">
              <strong>TAB</strong>
              <span>No. 0x6a28…9d38</span>
            </div>
            <div className="row line">
              <span>AUTHORIZED</span>
              <span>100.00</span>
            </div>
            <hr />
            {CHARGES.map((charge) => (
              <div className="row line" key={charge.label}>
                <span>charge · {charge.label}</span>
                <span>{charge.value}</span>
              </div>
            ))}
            <hr />
            <div className="row line">
              <span>CHARGED</span>
              <span>42.50</span>
            </div>
            <div className="row line total">
              <span>RETURNED TO PAYER</span>
              <span>57.50</span>
            </div>
            <div className="row end">
              <span>1 signature · 0 refunds to chase</span>
              <em className="stamp closed-stamp">Closed</em>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CALLS = [
  ["open", "anyone, before openBy", "Verify the signature, move the limit into escrow."],
  ["charge", "merchant, until captureBy", "Send part of the held amount to the merchant."],
  ["close", "merchant", "Return the held remainder to the payer."],
  ["reclaim", "anyone, after captureBy", "Return the held remainder to the payer."],
  ["refund", "merchant", "Send charged funds back to the payer."],
];

/** When each call is allowed, on a 12-column timeline. */
const WINDOWS = [
  { name: "open", from: 1, to: 4 },
  { name: "charge", from: 2, to: 10 },
  { name: "close", from: 2, to: 13 },
  { name: "refund", from: 3, to: 13, dashed: true },
  { name: "reclaim", from: 10, to: 13, red: true },
];

export function Landing() {
  useReveal();
  return (
    <>
      <Nav>
        <a className="button" href="/app/">
          Open the demo
        </a>
      </Nav>

      <section className="hero wrap">
        <div>
          <h1>
            Open a tab. Charge what was used. <em>Return the rest.</em>
          </h1>
          <p className="lede">
            One signature authorizes a limit. The merchant charges the real cost in parts, and
            whatever is not charged goes back to the payer, even if the merchant never comes back.
          </p>
          <div className="cta">
            <a className="button" href="/app/">
              Try it with a wallet
            </a>
            <a className="button ghost" href={REPO}>
              Read the contract
            </a>
          </div>
        </div>
        <PrintedBill />
      </section>

      <section className="strip" aria-label="Facts">
        <div className="wrap">
          <span>
            <b>1</b> signature per tab
          </span>
          <span>
            <b>5</b> calls
          </span>
          <span>
            <b>0</b> admin keys
          </span>
          <span>
            <b>12</b> tests in Fe
          </span>
        </div>
      </section>

      <section className="wrap block" data-reveal="">
        <h2>On-chain payments move everything at once.</h2>
        <p className="lede">
          A hotel, a ride or a metered API knows the limit first and the real cost later. Cards
          solve this with authorization and capture. On chain the payer overpays and waits.
        </p>
        <div className="versus" data-reveal="">
          <div className="slip">
            <div className="paper">
              <h3>
                Pay upfront <em className="stamp red">Overpaid</em>
              </h3>
              <dl className="lines">
                <div>
                  <dt>Paid now</dt>
                  <dd>100.00</dd>
                </div>
                <div>
                  <dt>Real cost</dt>
                  <dd>42.50</dd>
                </div>
                <div>
                  <dt>Refund</dt>
                  <dd>when the merchant sends it</dd>
                </div>
              </dl>
              <p className="hint">The payer trusts the merchant with 57.50 it never owed.</p>
            </div>
          </div>
          <div className="slip">
            <div className="paper">
              <h3>
                With a tab <em className="stamp">Settled</em>
              </h3>
              <dl className="lines">
                <div>
                  <dt>Held in escrow</dt>
                  <dd>100.00</dd>
                </div>
                <div>
                  <dt>Charged</dt>
                  <dd>42.50</dd>
                </div>
                <div>
                  <dt>Returned</dt>
                  <dd>57.50, by the contract</dd>
                </div>
              </dl>
              <p className="hint">The merchant can only take what it charges, up to the limit.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap block" id="how">
        <h2>Four steps, one signature.</h2>
        <Story />

        <div className="slip timeline-slip" data-reveal="">
          <div className="paper">
            <h3>
              <span>When</span> each call is allowed
            </h3>
            <div className="timeline" role="img" aria-label="Open is allowed from signing until openBy. Charge from opening until captureBy. Close and refund at any time after opening. Reclaim after captureBy.">
              <div className="ticks">
                <span style={{ gridColumn: "1 / 4" }}>signed</span>
                <span style={{ gridColumn: "4 / 10" }}>openBy</span>
                <span style={{ gridColumn: "10 / 13" }}>captureBy</span>
              </div>
              {WINDOWS.map((w) => (
                <div className="track" key={w.name}>
                  <code>{w.name}</code>
                  <div className="lane">
                    <i
                      className={w.red ? "red" : w.dashed ? "dashed" : undefined}
                      style={{ gridColumn: `${w.from} / ${w.to}` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="hint">
              After <code>captureBy</code> the merchant can no longer charge, and anyone can send
              the remainder back to the payer.
            </p>
          </div>
        </div>
      </section>

      <section className="dark" id="fe">
        <div className="wrap block fe">
          <div>
            <h2>The compiler knows what each call may touch.</h2>
            <p className="lede">
              Every handler lists the state and capabilities it uses. <code>refund</code> never
              names the held balance, so it cannot change it. In Solidity that is a convention
              reviewers check. Here it is a compile error.
            </p>
            <p className="error">
              error: contract field `held` is not in this handler's `uses`
            </p>
          </div>
          <pre className="code" data-reveal="">
            <code>
              <span className="k">Refund</span> {"{ id, amount }"}
              {"\n    "}
              <span className="k">uses</span> (ctx, <span className="k">mut</span> call, terms,
              charged,
              {"\n          "}
              <mark>mut refunded</mark>, <span className="k">mut</span> log)
              {"\n{\n    "}
              <span className="k">let</span> tab = terms.get(key: id)
              {"\n    "}
              <span className="k">if</span> ctx.caller() != tab.merchant {"{"}
              {"\n        "}revert_error(NotMerchant {"{}"})
              {"\n    }"}
              {"\n    "}
              <span className="c">// held is out of reach here</span>
              {"\n    "}refunded.set(key: id, value: done + amount)
              {"\n    "}erc20::safe_transfer_from(…)
              {"\n}"}
            </code>
          </pre>
        </div>
      </section>

      <section className="wrap block" id="contract">
        <h2>Five calls. No owner, no fees, no upgrades.</h2>
        <div className="slip">
          <div className="paper ledger">
            <div className="ledger-row ledger-head">
              <span>Call</span>
              <span>Who</span>
              <span>Effect</span>
            </div>
            {CALLS.map(([name, who, effect]) => (
              <div className="ledger-row" key={name}>
                <code>{name}</code>
                <span>{who}</span>
                <span>{effect}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="hint notes">
          Signatures from wallets (ECDSA) and from smart accounts (ERC-1271) are both accepted. Not
          audited. Fee-on-transfer tokens are not supported.
        </p>
      </section>

      <section className="wrap final" data-reveal="">
        <h2>
          Put it on <em>the tab.</em>
        </h2>
        <div className="cta">
          <a className="button" href="/app/">
            Open the demo
          </a>
          <a className="button ghost" href="/docs/">
            Read the docs
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
