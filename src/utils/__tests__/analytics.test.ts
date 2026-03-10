import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("analytics", () => {
  let originalDataLayer: unknown[];
  let originalGtag: typeof window.gtag | undefined;

  beforeEach(() => {
    originalDataLayer = window.dataLayer;
    originalGtag = window.gtag;
    vi.resetModules();
  });

  afterEach(() => {
    window.dataLayer = originalDataLayer;
    window.gtag = originalGtag as typeof window.gtag;
    vi.unstubAllEnvs();
    // Clean up any script tags added
    document
      .querySelectorAll('script[src*="googletagmanager"]')
      .forEach((el) => {
        el.remove();
      });
  });

  it("initGA4 does nothing when measurement ID is empty", async () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "");
    const { initGA4 } = await import("../analytics");
    initGA4();

    const scripts = document.querySelectorAll(
      'script[src*="googletagmanager"]',
    );
    expect(scripts.length).toBe(0);
  });

  it("initGA4 is idempotent — second call does not add another script", async () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TEST123");
    const { initGA4 } = await import("../analytics");
    initGA4();
    initGA4();

    const scripts = document.querySelectorAll(
      'script[src*="googletagmanager"]',
    );
    expect(scripts.length).toBe(1);
  });

  it("trackEvent is a no-op when GA4 is not initialized", async () => {
    const { trackEvent } = await import("../analytics");
    // Should not throw
    trackEvent("test_event", { key: "value" });
  });

  it("trackEvent calls gtag when initialized", async () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TEST456");
    const { initGA4, trackEvent } = await import("../analytics");
    initGA4();

    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackEvent("click", { button: "ok" });
    expect(gtagSpy).toHaveBeenCalledWith("event", "click", { button: "ok" });
  });
});
