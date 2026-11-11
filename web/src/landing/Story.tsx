import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    title: "Sign",
    text: "The payer signs one EIP-712 authorization: who may charge, which token, the limit and two deadlines. No transaction, no gas.",
    stamp: "Signed",
    held: "0.00",
    charged: "0.00",
    note: "Nothing has moved yet.",
  },
  {
    title: "Open",
    text: "Anyone submits the signature. The contract checks it and moves the limit into escrow. The digest becomes the tab id, so it can never open twice.",
    stamp: "Open",
    held: "100.00",
    charged: "0.00",
    note: "The limit is in escrow.",
  },
  {
    title: "Charge",
    text: "The merchant charges the real cost, in as many parts as needed, until the capture deadline. Never more than what is held.",
    stamp: "Open",
    held: "57.50",
    charged: "42.50",
    note: "Three charges, no new signatures.",
  },
  {
    title: "Settle",
    text: "The merchant closes the tab and the rest returns to the payer. If the merchant disappears, anyone can return it after the deadline.",
    stamp: "Closed",
    held: "0.00",
    charged: "42.50",
    note: "57.50 went back to the payer.",
  },
];

const CHARGES = [
  ["espresso ×2", "7.00"],
  ["lunch", "24.50"],
  ["service", "11.00"],
];

/** The four steps on the left; a bill on the right that follows the scroll. */
export function Story() {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    // A step is active while it crosses the middle of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    items.current.forEach((item) => item && observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const step = STEPS[active];
  const shown = (from: number) => (active >= from ? "fade on" : "fade");

  return (
    <div className="story">
      <ol>
        {STEPS.map((s, index) => (
          <li
            key={s.title}
            data-step={index}
            className={index === active ? "on" : undefined}
            ref={(el) => {
              items.current[index] = el;
            }}
          >
            <span className="num">0{index + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>

      <div className="follow" aria-hidden="true">
        <div className="slip">
          <div className="paper bill">
            <div className="row head">
              <strong>TAB</strong>
              <em key={step.stamp} className={`stamp pop ${step.stamp.toLowerCase()}`}>
                {step.stamp}
              </em>
            </div>
            <div className="row line">
              <span>AUTHORIZED</span>
              <span>100.00</span>
            </div>
            <div className="row line">
              <span>HELD IN ESCROW</span>
              <span key={step.held} className="tick">
                {step.held}
              </span>
            </div>
            <hr />
            {CHARGES.map(([label, value]) => (
              <div className={`row line ${shown(2)}`} key={label}>
                <span>charge · {label}</span>
                <span>{value}</span>
              </div>
            ))}
            <hr />
            <div className="row line">
              <span>CHARGED</span>
              <span key={step.charged} className="tick">
                {step.charged}
              </span>
            </div>
            <div className={`row line total ${shown(3)}`}>
              <span>RETURNED TO PAYER</span>
              <span>57.50</span>
            </div>
            <div className="row end">
              <span>{step.note}</span>
              <span>
                {active + 1} / {STEPS.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
