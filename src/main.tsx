import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ImageStoreProvider } from "./hooks/useImageStore";
import "./i18n";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ImageStoreProvider>
      <App />
    </ImageStoreProvider>
  </StrictMode>,
);
