import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { EntriesProvider } from "./features/entries/EntriesProvider";
import { registerServiceWorker } from "./pwa/register";
import "./index.css";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <EntriesProvider>
        <App />
      </EntriesProvider>
    </BrowserRouter>
  </StrictMode>,
);
