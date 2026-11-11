import type { ReactNode } from "react";
import deployment from "../deployment.json";
import { AsciiField, WORDMARK } from "./Ascii.tsx";

export const REPO = "https://github.com/enliven17/tab";

/** The mark: a bill with a torn bottom edge. */
export function Mark({ ink = "#1c1a16", paper = "#ece5d6" }: { ink?: string; paper?: string }) {
  return (
    <svg viewBox="0 0 28 32" aria-hidden="true">
      <path fill={ink} d="M2 1h24v27l-4 3-4-3-4 3-4-3-4 3-4-3z" />
      <path fill="none" stroke={paper} strokeWidth="2" d="M8 9h12M8 15h12M8 21h7" />
    </svg>
  );
}

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#fe", label: "Built in Fe" },
  { href: "/docs/", label: "Docs" },
  { href: "/brand/", label: "Brand" },
  { href: REPO, label: "GitHub" },
];

export function Nav({ current, children }: { current?: string; children?: ReactNode }) {
  return (
    <header className="bar">
      <div className="wrap">
        <a className="mark" href="/" aria-label="Tab home">
          <Mark />
          TAB
        </a>
        <nav aria-label="Main">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={link.href === current ? "page" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        {children}
      </div>
      <i className="progress" aria-hidden="true" />
    </header>
  );
}

const NETWORKS: Record<number, { name: string; explorer?: string }> = {
  31337: { name: "Anvil (local)" },
  11155111: { name: "Sepolia", explorer: "https://sepolia.etherscan.io/address/" },
};

function Contract({ label, address }: { label: string; address: string }) {
  const explorer = NETWORKS[deployment.chainId]?.explorer;
  const short = `${address.slice(0, 8)}…${address.slice(-6)}`;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{explorer ? <a href={explorer + address}>{short}</a> : short}</dd>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <AsciiField color="#fbf8f1" />
      <div className="wrap">
        <div className="foot-top">
          <pre className="wordmark" aria-label="Tab">
            {WORDMARK}
          </pre>
          <p>
            Open a tab. Charge what was used. <em>Return the rest.</em>
          </p>
          <div className="foot-cta">
            <a className="button" href="/app/">
              Open the demo
            </a>
            <a className="button ghost" href={REPO}>
              Source on GitHub
            </a>
          </div>
        </div>

        <div className="foot-grid">
          <nav aria-label="Product">
            <h4>Product</h4>
            <a href="/">Overview</a>
            <a href="/app/">Demo</a>
            <a href="/docs/">Docs</a>
            <a href="/brand/">Brand kit</a>
          </nav>
          <nav aria-label="Developers">
            <h4>Developers</h4>
            <a href="/docs/#quickstart">Quick start</a>
            <a href="/docs/#authorization">The authorization</a>
            <a href="/docs/#calls">Calls</a>
            <a href="/docs/#integrate">Integrate with viem</a>
          </nav>
          <nav aria-label="Project">
            <h4>Project</h4>
            <a href={REPO}>GitHub</a>
            <a href={`${REPO}/blob/main/src/lib.fe`}>The contract</a>
            <a href="https://fe-lang.org">Fe language</a>
            <a href="https://fe-lang.org/contest/">Fe Builders Challenge</a>
          </nav>
          <dl className="foot-slip">
            <div>
              <dt>Network</dt>
              <dd>{NETWORKS[deployment.chainId]?.name ?? deployment.chainId}</dd>
            </div>
            <Contract label="Tab" address={deployment.tab} />
            <Contract label="Test token" address={deployment.token} />
            <div>
              <dt>Fe</dt>
              <dd>26.6.0</dd>
            </div>
          </dl>
        </div>

        <div className="foot-end">
          <span>Not audited. The demo uses a test token with no value.</span>
          <span>Apache-2.0 · Built for the Fe Builders Challenge 2026</span>
        </div>
      </div>
    </footer>
  );
}
