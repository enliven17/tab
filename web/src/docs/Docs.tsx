import { useEffect, useState, type ReactNode } from "react";
import { useReveal } from "../ui/motion.ts";
import { Footer, Nav, REPO } from "../ui/Shell.tsx";
import { chain, tab, token } from "../wallet.ts";

const SECTIONS = [
  ["overview", "Overview"],
  ["quickstart", "Quick start"],
  ["authorization", "The authorization"],
  ["calls", "Calls"],
  ["views", "Views"],
  ["errors", "Errors"],
  ["events", "Events"],
  ["integrate", "Integrate with viem"],
  ["security", "Security and limits"],
] as const;

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="snippet">
      <button className="ghost copy" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TYPED_DATA = `Authorization(
  address payer,
  address merchant,
  address token,
  uint256 limit,
  uint256 openBy,
  uint256 captureBy,
  uint256 nonce
)

domain: { name: "Tab", version: "1", chainId, verifyingContract: <Tab address> }`;

const QUICKSTART = `anvil                      # local chain, in another terminal
fe test && fe build        # Fe 26.6.0
cd web && pnpm install
pnpm run deploy            # deploys Tab and DemoToken
pnpm run e2e               # sign, open, charge, close, refund
pnpm dev`;

const SIGN = `import { hashTypedData, hexToBigInt } from "viem";
import { typedData, tabAbi, openArgs } from "./tab";

const message = {
  payer, merchant, token,
  limit: 100_000000n,                 // 100.00 with 6 decimals
  openBy: now + 900n,                 // 15 minutes to open
  captureBy: now + 3600n,             // 1 hour to charge
  nonce: 1n,
};

// Payer: one signature, no transaction. The payer must have
// approved the Tab contract for \`limit\` on the token.
const data = typedData(chainId, tabAddress, message);
const signature = await wallet.signTypedData({ account: payer, ...data });

// The tab id is the EIP-712 digest.
const id = hexToBigInt(hashTypedData(data));`;

const SETTLE = `// Merchant: open, charge in parts, then close.
await wallet.writeContract({
  address: tabAddress, abi: tabAbi, functionName: "open",
  args: openArgs({ ...message, signature }),
});
await wallet.writeContract({
  address: tabAddress, abi: tabAbi, functionName: "charge",
  args: [id, 30_000000n],
});
await wallet.writeContract({
  address: tabAddress, abi: tabAbi, functionName: "close",
  args: [id],
});`;

export function Docs() {
  useReveal();
  const [active, setActive] = useState<string>("overview");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    document.querySelectorAll("article section[id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Nav current="/docs/">
        <a className="button" href="/app/">
          Open the demo
        </a>
      </Nav>

      <div className="wrap docs">
        <aside>
          <nav aria-label="Sections">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`} aria-current={active === id ? "true" : undefined}>
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <article>
          <section id="overview">
            <h1>Tab documentation</h1>
            <p className="lede">
              Tab is an auth-capture payment escrow written in Fe. A payer signs one authorization
              with a limit. The merchant opens a tab from it, charges the real cost in parts, and
              the contract returns whatever is left.
            </p>
            <Table
              head={["", ""]}
              rows={[
                ["Network", chain.name],
                ["Tab contract", <code>{tab}</code>],
                ["Test token", <code>{token}</code>],
                ["Source", <a href={REPO}>github.com/enliven17/tab</a>],
              ]}
            />
          </section>

          <section id="quickstart" data-reveal="">
            <h2>Quick start</h2>
            <p>
              You need Fe 26.6.0, Node 24, pnpm and Foundry's <code>anvil</code>.
            </p>
            <Code>{QUICKSTART}</Code>
            <p>
              <code>pnpm run deploy</code> reads <code>RPC_URL</code> and <code>PRIVATE_KEY</code>{" "}
              to deploy to another network and writes the addresses to{" "}
              <code>web/src/deployment.json</code>.
            </p>
          </section>

          <section id="authorization" data-reveal="">
            <h2>The authorization</h2>
            <p>
              The payer signs this EIP-712 struct. It is the only thing the payer ever signs for a
              tab.
            </p>
            <Code>{TYPED_DATA}</Code>
            <Table
              head={["Field", "Meaning"]}
              rows={[
                [<code>payer</code>, "The account that pays. An EOA or an ERC-1271 smart account."],
                [<code>merchant</code>, "The only account that can charge, close and refund."],
                [<code>token</code>, "The ERC-20 token. The payer must approve the contract for the limit."],
                [<code>limit</code>, "The most that can ever be charged. Moved into escrow on open."],
                [<code>openBy</code>, "Last moment the authorization can open a tab. Keep it short."],
                [<code>captureBy</code>, "Last moment the merchant can charge. After it, the rest can be reclaimed."],
                [<code>nonce</code>, "Any number. It makes two otherwise equal authorizations distinct."],
              ]}
            />
            <p>
              The tab id is the EIP-712 digest of this struct. The contract stores the terms under
              that id and never clears them, so one authorization opens exactly one tab.
            </p>
          </section>

          <section id="calls" data-reveal="">
            <h2>Calls</h2>
            <Table
              head={["Call", "Who", "Effect"]}
              rows={[
                [<code>open(…, signature)</code>, "anyone, before openBy", "Checks the signature and moves the limit into escrow. Returns the tab id."],
                [<code>charge(id, amount)</code>, "merchant, until captureBy", "Sends part of the held amount to the merchant."],
                [<code>close(id)</code>, "merchant", "Returns the held remainder to the payer."],
                [<code>reclaim(id)</code>, "anyone, after captureBy", "Returns the held remainder to the payer."],
                [<code>refund(id, amount)</code>, "merchant", "Pulls charged funds from the merchant and sends them to the payer."],
              ]}
            />
            <p>
              <code>refund</code> needs the merchant to approve the contract for the refunded amount.
              The total refunded can never exceed the total charged.
            </p>
          </section>

          <section id="views" data-reveal="">
            <h2>Views</h2>
            <Table
              head={["View", "Returns"]}
              rows={[
                [<code>terms(id)</code>, "payer, merchant, token, captureBy. The payer is the zero address if the tab does not exist."],
                [<code>held(id)</code>, "What is still in escrow."],
                [<code>charged(id)</code>, "Total charged so far."],
                [<code>refunded(id)</code>, "Total refunded so far."],
                [<code>digest(…)</code>, "The tab id for a set of terms, computed on chain."],
              ]}
            />
          </section>

          <section id="errors" data-reveal="">
            <h2>Errors</h2>
            <Table
              head={["Error", "When"]}
              rows={[
                [<code>Expired()</code>, "open after openBy, or charge after captureBy."],
                [<code>NotExpired()</code>, "reclaim before captureBy has passed."],
                [<code>ZeroAmount()</code>, "A zero limit or amount, or nothing left to return."],
                [<code>NoMerchant()</code>, "The authorization names the zero address as merchant."],
                [<code>AlreadyOpen()</code>, "The authorization already opened a tab."],
                [<code>BadSignature()</code>, "The signature does not match the payer and terms."],
                [<code>NotMerchant()</code>, "charge, close or refund from another account."],
                [<code>ExceedsHeld()</code>, "A charge larger than what is held."],
                [<code>ExceedsCharged()</code>, "A refund larger than charged minus refunded."],
              ]}
            />
          </section>

          <section id="events" data-reveal="">
            <h2>Events</h2>
            <Table
              head={["Event", "Emitted by"]}
              rows={[
                [<code>Opened(id, payer, merchant, token, limit, captureBy)</code>, "open"],
                [<code>ChargedTab(id, amount)</code>, "charge"],
                [<code>Released(id, amount)</code>, "close and reclaim"],
                [<code>RefundedTab(id, amount)</code>, "refund"],
              ]}
            />
          </section>

          <section id="integrate" data-reveal="">
            <h2>Integrate with viem</h2>
            <p>
              <code>web/src/tab.ts</code> exports the ABI, the typed data and helpers. The payer
              side is one signature:
            </p>
            <Code>{SIGN}</Code>
            <p>The merchant side is ordinary transactions:</p>
            <Code>{SETTLE}</Code>
            <p>
              <code>open</code> is permissionless. If someone else submits the authorization first,
              the merchant's own <code>open</code> reverts with <code>AlreadyOpen</code>, but the
              tab exists with the signed terms. Check <code>terms(id)</code> and carry on.
            </p>
          </section>

          <section id="security" data-reveal="">
            <h2>Security and limits</h2>
            <ul>
              <li>Not audited. The demo uses a test token with no value.</li>
              <li>No owner, no fees, no upgrade path. Nobody can move funds outside these calls.</li>
              <li>State is written before every token transfer, so a re-entrant call sees the tab as already settled.</li>
              <li>Signature bytes are never used as an identifier, so the two valid encodings of one signature cannot open a second tab.</li>
              <li>Fee-on-transfer and rebasing tokens are not supported.</li>
              <li>A signed authorization cannot be cancelled before openBy.</li>
              <li>If the token blocks transfers to the payer, the held remainder is stuck.</li>
            </ul>
          </section>
        </article>
      </div>

      <Footer />
    </>
  );
}
