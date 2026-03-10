const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? "";

let initialized = false;

export function initGA4() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID) return;

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    (window.dataLayer as unknown[]).push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);

  initialized = true;
}

export function trackEvent(eventName: string, params?: Record<string, string>) {
  if (!initialized) return;
  window.gtag?.("event", eventName, params);
}

// Extend Window for gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
