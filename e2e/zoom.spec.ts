import { test, expect } from "@playwright/test";
import path from "path";
import { getZoomText, loadTestImage } from "./helpers.js";

const FIXTURE = path.resolve(import.meta.dirname, "fixtures/test-2x2.png");

test.describe("Zoom", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadTestImage(page, FIXTURE);
  });

  test("image canvas is present after loading", async ({ page }) => {
    await expect(page.locator("main canvas")).toBeVisible();
  });

  test("zoom in with + key", async ({ page }) => {
    const initialText = await getZoomText(page);

    await page.keyboard.press("+");

    // Wait for zoom text to change
    const span = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(span).not.toHaveText(initialText);
  });

  test("zoom out with - key", async ({ page }) => {
    const initialText = await getZoomText(page);

    await page.keyboard.press("-");

    // Wait for zoom text to change
    const span = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(span).not.toHaveText(initialText);
  });

  test("fit to screen with 0 key", async ({ page }) => {
    // Zoom in first to change from default
    const initialText = await getZoomText(page);
    await page.keyboard.press("+");
    const span = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(span).not.toHaveText(initialText);

    const zoomedText = await getZoomText(page);

    // Fit to screen
    await page.keyboard.press("0");
    await expect(span).not.toHaveText(zoomedText);
  });

  test("actual size (100%) with 1 key", async ({ page }) => {
    await page.keyboard.press("1");

    const span = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(span).toHaveText("100%");
  });
});
