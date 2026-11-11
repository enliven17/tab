import type { ReactNode } from "react";

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

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <span>Tab. Auth-capture payments in Fe. Not audited; demo uses a valueless test token.</span>
        <nav aria-label="Footer">
          <a href="/app/">Demo</a>
          <a href="/docs/">Docs</a>
          <a href="/brand/">Brand</a>
          <a href={REPO}>Source</a>
        </nav>
      </div>
    </footer>
  );
}
