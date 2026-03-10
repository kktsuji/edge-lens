import { test, expect } from "@playwright/test";
import { FIXTURE, getZoomPercent, loadTestImage } from "./helpers.js";

test.describe("Zoom", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadTestImage(page, FIXTURE);
  });

  test("image canvas is present after loading", async ({ page }) => {
    await expect(page.locator("main canvas")).toBeVisible();
  });

  test("zoom in with + key", async ({ page }) => {
    const initialZoom = await getZoomPercent(page);

    await page.keyboard.press("+");

    const span = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(span).not.toHaveText(`${initialZoom}%`);
    const newZoom = await getZoomPercent(page);
    expect(newZoom).toBeGreaterThan(initialZoom);
  });

  test("zoom out with - key", async ({ page }) => {
    const initialZoom = await getZoomPercent(page);

    await page.keyboard.press("-");

    const span = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(span).not.toHaveText(`${initialZoom}%`);
    const newZoom = await getZoomPercent(page);
    expect(newZoom).toBeLessThan(initialZoom);
  });

  test("fit to screen with 0 key", async ({ page }) => {
    // Go to a known zoom level first
    await page.keyboard.press("1");
    const span = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(span).toHaveText("100%");

    // Fit to screen — for a 2x2 image the fit zoom will differ from 100%
    await page.keyboard.press("0");
    await expect(span).not.toHaveText("100%");
  });

  test("actual size (100%) with 1 key", async ({ page }) => {
    await page.keyboard.press("1");

    const span = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(span).toHaveText("100%");
  });
});
