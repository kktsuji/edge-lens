import { test, expect } from "@playwright/test";
import {
  FIXTURE,
  drawOnCanvas,
  getZoomPercent,
  loadTestImage,
  switchToolMode,
} from "./helpers.js";

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

    const zoomSpan = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(zoomSpan).not.toHaveText(`${initialZoom}%`);
    const newZoom = await getZoomPercent(page);
    expect(newZoom).toBeGreaterThan(initialZoom);
  });

  test("zoom out with - key", async ({ page }) => {
    const initialZoom = await getZoomPercent(page);

    await page.keyboard.press("-");

    const zoomSpan = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(zoomSpan).not.toHaveText(`${initialZoom}%`);
    const newZoom = await getZoomPercent(page);
    expect(newZoom).toBeLessThan(initialZoom);
  });

  test("fit to screen with 0 key", async ({ page }) => {
    // Go to a known zoom level first
    await page.keyboard.press("1");
    const zoomSpan = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(zoomSpan).toHaveText("100%");

    // Fit to screen — for a 2x2 image the fit zoom will differ from 100%
    await page.keyboard.press("0");
    await expect(zoomSpan).not.toHaveText("100%");
  });

  test("actual size (100%) with 1 key", async ({ page }) => {
    await page.keyboard.press("1");

    const zoomSpan = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(zoomSpan).toHaveText("100%");
  });
});

test.describe("Click-drag panning", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadTestImage(page, FIXTURE);
    // Zoom to 100% so the small test image has room to pan
    await page.keyboard.press("1");
    const zoomSpan = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(zoomSpan).toHaveText("100%");
  });

  test("click-drag pans in navigate mode", async ({ page }) => {
    const canvas = page.locator("main canvas");
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Take a screenshot before dragging to compare canvas content shift
    const before = await canvas.screenshot();

    // Drag from center towards top-left
    await drawOnCanvas(page, canvas, { x: 50, y: 50 }, { x: 30, y: 30 });

    const after = await canvas.screenshot();
    // Canvas content should have shifted
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test("canvas shows crosshair cursor in ROI mode", async ({ page }) => {
    await switchToolMode(page, "roi");

    const canvas = page.locator("main canvas");
    await expect(canvas).toHaveClass(/cursor-crosshair/);
  });

  test("canvas shows crosshair cursor in line-profile mode", async ({
    page,
  }) => {
    await switchToolMode(page, "line-profile");

    const canvas = page.locator("main canvas");
    await expect(canvas).toHaveClass(/cursor-crosshair/);
  });

  test("canvas shows default cursor in navigate mode", async ({ page }) => {
    const canvas = page.locator("main canvas");
    // Navigate mode should NOT have crosshair — default cursor for pixel inspector
    const cls = await canvas.getAttribute("class");
    expect(cls).not.toContain("cursor-crosshair");
    expect(cls).not.toContain("cursor-grab");
  });
});
