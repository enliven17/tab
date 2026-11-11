// The 1280x640 banner used for the README and link previews. Rendered at
// /banner/ and captured to an image; see the brand kit.
import "../ui/fonts.ts";
import "../ui/base.css";
import "./banner.css";
import { createRoot } from "react-dom/client";
import { Mark } from "../ui/Shell.tsx";

createRoot(document.getElementById("root")!).render(
  <div className="banner">
    <div>
      <span className="mark">
        <Mark />
        TAB
      </span>
      <h1>
        Open a tab. Charge what was used. <em>Return the rest.</em>
      </h1>
    </div>
    <div className="slip">
      <div className="paper">
        <div className="r head">
          <strong>TAB</strong>
          <span>No. 0x6a28…9d38</span>
        </div>
        <div className="r">
          <span>AUTHORIZED</span>
          <span>100.00</span>
        </div>
        <hr />
        <div className="r">
          <span>charge · espresso ×2</span>
          <span>7.00</span>
        </div>
        <div className="r">
          <span>charge · lunch</span>
          <span>24.50</span>
        </div>
        <div className="r">
          <span>charge · service</span>
          <span>11.00</span>
        </div>
        <hr />
        <div className="r">
          <span>CHARGED</span>
          <span>42.50</span>
        </div>
        <div className="r total">
          <span>RETURNED TO PAYER</span>
          <span>57.50</span>
        </div>
        <em className="stamp red">Closed</em>
      </div>
    </div>
  </div>,
);
