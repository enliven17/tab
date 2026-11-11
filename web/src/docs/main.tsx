import "../ui/fonts.ts";
import "../ui/base.css";
import "./docs.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Docs } from "./Docs.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Docs />
  </StrictMode>,
);
