import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AuthGate } from "./features/auth/AuthGate";
import { registerServiceWorker } from "./pwa/register";
import "./index.css";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <AuthGate />
    </HashRouter>
  </StrictMode>,
);
