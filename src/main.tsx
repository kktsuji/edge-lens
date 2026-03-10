import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { ImageStoreProvider } from "./hooks/useImageStore";
import "./i18n";
import "./index.css";
import { initGA4 } from "./utils/analytics";

initGA4();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <ImageStoreProvider>
        <App />
      </ImageStoreProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
