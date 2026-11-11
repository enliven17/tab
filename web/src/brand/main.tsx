import "../ui/fonts.ts";
import "../ui/base.css";
import "./brand.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Brand } from "./Brand.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Brand />
  </StrictMode>,
);
