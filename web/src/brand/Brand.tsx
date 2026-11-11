import { Footer, Mark, Nav } from "../ui/Shell.tsx";

const COLORS = [
  { name: "Desk", token: "--desk", hex: "#ECE5D6", use: "Page background" },
  { name: "Paper", token: "--paper", hex: "#FBF8F1", use: "Slips and cards" },
  { name: "Ink", token: "--ink", hex: "#1C1A16", use: "Text, buttons, the mark", light: true },
  { name: "Faint", token: "--faint", hex: "#7D7667", use: "Labels and secondary text", light: true },
  { name: "Rule", token: "--rule", hex: "#CFC7B5", use: "Dashed rules and borders" },
  { name: "Stamp", token: "--stamp", hex: "#D2412A", use: "The one accent. Use it sparingly.", light: true },
  { name: "Paid", token: "--paid", hex: "#2D6A4F", use: "Open and settled states", light: true },
];

const LOGOS = [
  { file: "tab-mark.svg", label: "Mark", ink: "#1c1a16", paper: "#ece5d6", bg: "var(--desk-deep)" },
  { file: "tab-mark-inverse.svg", label: "Mark, inverse", ink: "#fbf8f1", paper: "#1c1a16", bg: "var(--ink)" },
  { file: "tab-mark-stamp.svg", label: "Mark, stamp", ink: "#d2412a", paper: "#fbf8f1", bg: "var(--paper)" },
];

export function Brand() {
  return (
    <>
      <Nav current="/brand/">
        <a className="button" href="/app/">
          Open the demo
        </a>
      </Nav>

      <main className="wrap kit">
        <h1>A bill, not a bank.</h1>
        <p className="lede">
          Tab looks like the slip of paper a waiter leaves on the table: cream paper, printed ink,
          dashed rules, and one red stamp. It should feel exact and a little warm, never glossy.
        </p>

        <section>
          <h2>Logo</h2>
          <p className="note">
            The mark is a bill with a torn bottom edge. The wordmark is TAB in JetBrains Mono
            ExtraBold, tracked out by 0.24em. Keep one mark-height of clear space around it.
          </p>
          <div className="logos">
            <div className="tile lockup">
              <span className="mark big">
                <Mark />
                TAB
              </span>
              <a href="/brand/tab-lockup.svg" download>
                Lockup · SVG
              </a>
            </div>
            {LOGOS.map((logo) => (
              <div className="tile" key={logo.file} style={{ background: logo.bg }}>
                <span className="glyph">
                  <Mark ink={logo.ink} paper={logo.paper} />
                </span>
                <a
                  href={`/brand/${logo.file}`}
                  download
                  style={{ color: logo.bg === "var(--ink)" ? "#fbf8f1" : undefined }}
                >
                  {logo.label} · SVG
                </a>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Color</h2>
          <p className="note">
            Mostly paper and ink. Stamp red marks one thing per view: a state, a number, an
            emphasis. Green appears only for open or settled tabs.
          </p>
          <div className="swatches">
            {COLORS.map((color) => (
              <div className="swatch" key={color.name}>
                <div
                  className="chip"
                  style={{ background: `var(${color.token})`, color: color.light ? "#fbf8f1" : "#1c1a16" }}
                >
                  {color.hex}
                </div>
                <strong>{color.name}</strong>
                <code>{color.token}</code>
                <span>{color.use}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Type</h2>
          <div className="type">
            <div>
              <p className="specimen serif">Return the rest.</p>
              <p className="note">
                <strong>Instrument Serif</strong> · headlines only, regular weight, tight leading.
                Italic for the one phrase that matters.
              </p>
            </div>
            <div>
              <p className="specimen mono">CHARGED 42.50</p>
              <p className="note">
                <strong>JetBrains Mono</strong> · everything else: body, labels, numbers. Tabular
                figures always. Labels are uppercase, 11px, tracked 0.08em.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>Elements</h2>
          <div className="elements">
            <div className="slip">
              <div className="paper">
                <h3>
                  <span>03</span> The tab <em className="stamp">Open</em>
                </h3>
                <dl className="lines">
                  <div>
                    <dt>Charged</dt>
                    <dd>42.50</dd>
                  </div>
                  <div>
                    <dt>Refunded</dt>
                    <dd>−2.50</dd>
                  </div>
                  <div className="total">
                    <dt>Still held</dt>
                    <dd>57.50 tUSD</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="stack">
              <div className="row">
                <button>Primary</button>
                <button className="ghost">Secondary</button>
              </div>
              <div className="row">
                <em className="stamp">Open</em>
                <em className="stamp closed">Closed</em>
                <em className="stamp expired">Expired</em>
              </div>
              <label>
                Field label
                <input defaultValue="25.00" />
              </label>
              <p className="note">
                Slips have a torn bottom edge and a soft shadow. Rules are dashed. Line items use
                dotted leaders. Corners are 2px; nothing is rounded more than a stamp.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>Voice</h2>
          <div className="voice">
            <div>
              <strong>Say</strong>
              <p>Open a tab. Charge what was used. Return the rest.</p>
              <p>The merchant can only take what it charges.</p>
            </div>
            <div>
              <strong>Not</strong>
              <p>Revolutionizing the future of decentralized payments.</p>
              <p>Seamless, trustless, next-generation escrow infrastructure.</p>
            </div>
          </div>
          <p className="note">
            Short sentences. Plain verbs: open, charge, close, return. Numbers always with two
            decimals. Say what happens to the money.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
