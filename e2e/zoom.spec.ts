import { test, expect } from "@playwright/test";
import {
  FIXTURE,
  drawOnCanvas,
  getZoomPercent,
  loadTestImage,
  resetZoomTo100,
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
    const zoomSpan = await resetZoomTo100(page);

    await page.keyboard.press("+");

    await expect(zoomSpan).not.toHaveText("100%");
    const newZoom = await getZoomPercent(page);
    expect(newZoom).toBeGreaterThan(100);
  });

  test("zoom out with - key", async ({ page }) => {
    const zoomSpan = await resetZoomTo100(page);

    await page.keyboard.press("-");

    await expect(zoomSpan).not.toHaveText("100%");
    const newZoom = await getZoomPercent(page);
    expect(newZoom).toBeLessThan(100);
  });

  test("fit to screen with 0 key", async ({ page }) => {
    const zoomSpan = await resetZoomTo100(page);

    // Fit to screen — for a 2x2 image the fit zoom will differ from 100%
    await page.keyboard.press("0");
    await expect(zoomSpan).not.toHaveText("100%");
  });

  test("actual size (100%) with 1 key", async ({ page }) => {
    await resetZoomTo100(page);
  });
});

test.describe("Click-drag panning", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadTestImage(page, FIXTURE);
    // Zoom to 100% so the small test image has room to pan
    await resetZoomTo100(page);
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
    // The 2×2 fixture at 100% zoom is smaller than the canvas, so dragging
    // shifts the rendered content and produces a different screenshot.
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

  test("canvas shows grab cursor in navigate mode", async ({ page }) => {
    const canvas = page.locator("main canvas");
    await expect(canvas).toHaveClass(/cursor-grab/);
  });

  test("Space+drag shows correct cursor transitions in ROI mode", async ({
    page,
  }) => {
    await switchToolMode(page, "roi");
    const canvas = page.locator("main canvas");
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Space down → grab cursor (via inline style)
    await page.keyboard.down("Space");
    await expect(canvas).toHaveCSS("cursor", "grab");

    // Mouse down → grabbing cursor
    await page.mouse.move(box!.x + 50, box!.y + 50);
    await page.mouse.down();
    await expect(canvas).toHaveCSS("cursor", "grabbing");

    // Mouse up → back to grab
    await page.mouse.up();
    await expect(canvas).toHaveCSS("cursor", "grab");

    // Space up → inline cursor cleared
    await page.keyboard.up("Space");
    const inlineCursor = await canvas.evaluate(
      (el) => (el as HTMLElement).style.cursor,
    );
    expect(inlineCursor).toBe("");
  });
});
