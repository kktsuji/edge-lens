import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("analytics", () => {
  let originalDataLayer: unknown[];
  let originalGtag: ((...args: unknown[]) => void) | undefined;

  beforeEach(() => {
    originalDataLayer = window.dataLayer;
    originalGtag = window.gtag;
    vi.resetModules();
  });

  afterEach(() => {
    window.dataLayer = originalDataLayer;
    window.gtag = originalGtag!;
    // Clean up any script tags added
    document
      .querySelectorAll('script[src*="googletagmanager"]')
      .forEach((el) => el.remove());
  });

  it("initGA4 creates a script tag and sets up gtag", async () => {
    const { initGA4 } = await import("../analytics");
    initGA4();

    const scripts = document.querySelectorAll(
      'script[src*="googletagmanager"]',
    );
    expect(scripts.length).toBe(1);
    expect(typeof window.gtag).toBe("function");
    expect(Array.isArray(window.dataLayer)).toBe(true);
  });

  it("initGA4 is idempotent — second call does not add another script", async () => {
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
    const { initGA4, trackEvent } = await import("../analytics");
    initGA4();

    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackEvent("click", { button: "ok" });
    expect(gtagSpy).toHaveBeenCalledWith("event", "click", { button: "ok" });
  });
});
