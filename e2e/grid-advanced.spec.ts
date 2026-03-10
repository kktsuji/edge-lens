import { test, expect } from "@playwright/test";
import {
  FIXTURE,
  drawOnCanvas,
  getCellZoom,
  getZoomPercent,
  loadImageIntoGridCell,
  loadTestImage,
  openGridMode,
  switchToolMode,
} from "./helpers.js";

test.describe("Grid Advanced", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("ROI selection works in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);

    // Click the cell to activate it before switching tools
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    await switchToolMode(page, "roi");
    const canvas = page.locator("[data-cell-id] canvas").first();
    await drawOnCanvas(page, canvas, { x: 20, y: 20 }, { x: 80, y: 80 });

    await expect(page.getByText("ROI Statistics")).toBeVisible();
  });

  test("line profile works in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);

    // Click the cell to activate it before switching tools
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    await switchToolMode(page, "line-profile");
    const canvas = page.locator("[data-cell-id] canvas").first();
    await drawOnCanvas(page, canvas, { x: 20, y: 50 }, { x: 80, y: 50 });

    await expect(page.getByText("Line Profile").first()).toBeVisible();
  });

  test("custom layout 3x3 creates 9 cells", async ({ page }) => {
    const gridBtn = page.getByRole("button", { name: "Grid View (G)" });
    await gridBtn.click();
    const dropdown = page.locator("#grid-layout-dropdown");
    await expect(dropdown).toBeVisible();

    // Use custom layout inputs
    const rowsInput = dropdown.locator('input[aria-label="Rows"]');
    const colsInput = dropdown.locator('input[aria-label="Columns"]');

    await rowsInput.fill("3");
    await colsInput.fill("3");
    await dropdown.getByRole("button", { name: "OK" }).click();

    await expect(page.locator("[data-cell-id]")).toHaveCount(9);
  });

  test("single view image transfers to grid cell [1,1]", async ({ page }) => {
    // Load image in single view
    await loadTestImage(page, FIXTURE);
    await expect(page.locator("#main-content canvas")).toBeVisible();
    await expect(page.getByText("test-2x2.png")).toBeVisible();

    // Switch to grid mode
    await openGridMode(page);

    // First cell should have a visible canvas with the transferred image
    const firstCell = page.locator("[data-cell-id]").first();
    await expect(firstCell.locator("canvas")).toBeVisible();
  });

  test("grid cell [1,1] image transfers to single view", async ({ page }) => {
    // Load image in single view first
    await loadTestImage(page, FIXTURE);
    await expect(page.locator("#main-content canvas")).toBeVisible();

    // Enter grid mode (transfers image to cell 0-0)
    await openGridMode(page);
    const firstCell = page.locator("[data-cell-id]").first();
    await expect(firstCell.locator("canvas")).toBeVisible();

    // Exit grid mode via G key (toggles grid off, restores cell 0-0 to single view)
    await page.keyboard.press("g");

    // Grid cells should be gone
    await expect(page.locator("[data-cell-id]")).toHaveCount(0);

    // Single view canvas should be visible with the transferred image
    await expect(page.locator("#main-content canvas")).toBeVisible();
    await expect(page.getByText("test-2x2.png")).toBeVisible();
  });

  test("Escape exits grid mode", async ({ page }) => {
    // Use G key to enable grid directly
    await page.keyboard.press("g");
    await expect(page.locator("[data-cell-id]").first()).toBeVisible();

    // Navigate mode is default, so Escape should exit grid
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-cell-id]")).toHaveCount(0);
  });

  // --- Zoom/Pan in Grid Cell ---

  test("zoom in with + key works in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);
    const cell = page.locator("[data-cell-id]").first();
    await cell.click();

    const initialZoom = await getCellZoom(cell);
    await page.keyboard.press("+");

    await expect(cell).not.toHaveAttribute("data-zoom", String(initialZoom));
    const newZoom = await getCellZoom(cell);
    expect(newZoom).toBeGreaterThan(initialZoom);
  });

  test("zoom out with - key works in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);
    const cell = page.locator("[data-cell-id]").first();
    await cell.click();

    const initialZoom = await getCellZoom(cell);
    await page.keyboard.press("-");

    await expect(cell).not.toHaveAttribute("data-zoom", String(initialZoom));
    const newZoom = await getCellZoom(cell);
    expect(newZoom).toBeLessThan(initialZoom);
  });

  test("actual size (100%) with 1 key works in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);
    const cell = page.locator("[data-cell-id]").first();
    await cell.click();

    await page.keyboard.press("1");

    await expect(cell).toHaveAttribute("data-zoom", "100");
  });

  test("fit to screen with 0 key works in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);
    const cell = page.locator("[data-cell-id]").first();
    await cell.click();

    // Go to a known zoom level first
    await page.keyboard.press("1");
    await expect(cell).toHaveAttribute("data-zoom", "100");

    // Fit to screen — for a 2x2 image the fit zoom will differ from 100%
    await page.keyboard.press("0");
    await expect(cell).not.toHaveAttribute("data-zoom", "100");
  });

  // --- Tools Work After Single-to-Grid Transition ---

  test("zoom works after single-to-grid transition", async ({ page }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    const cell = page.locator("[data-cell-id]").first();
    await cell.click();

    const initialZoom = await getCellZoom(cell);
    await page.keyboard.press("+");

    await expect(cell).not.toHaveAttribute("data-zoom", String(initialZoom));
    const newZoom = await getCellZoom(cell);
    expect(newZoom).toBeGreaterThan(initialZoom);
  });

  test("ROI works after single-to-grid transition", async ({ page }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    await page.locator("[data-cell-id]").first().click();

    await switchToolMode(page, "roi");
    const canvas = page.locator("[data-cell-id] canvas").first();
    await drawOnCanvas(page, canvas, { x: 20, y: 20 }, { x: 80, y: 80 });

    await expect(page.getByText("ROI Statistics")).toBeVisible();
  });

  test("line profile works after single-to-grid transition", async ({
    page,
  }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    await page.locator("[data-cell-id]").first().click();

    await switchToolMode(page, "line-profile");
    const canvas = page.locator("[data-cell-id] canvas").first();
    await drawOnCanvas(page, canvas, { x: 20, y: 50 }, { x: 80, y: 50 });

    await expect(page.getByText("Line Profile").first()).toBeVisible();
  });

  // --- Tools Work After Grid-to-Single Transition ---

  test("zoom works after grid-to-single transition", async ({ page }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    await page.keyboard.press("g");
    await expect(page.locator("[data-cell-id]")).toHaveCount(0);
    await expect(page.locator("main canvas")).toBeVisible();

    const initialZoom = await getZoomPercent(page);
    await page.keyboard.press("+");

    const span = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(span).not.toHaveText(`${initialZoom}%`);
    const newZoom = await getZoomPercent(page);
    expect(newZoom).toBeGreaterThan(initialZoom);
  });

  test("ROI works after grid-to-single transition", async ({ page }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    await page.keyboard.press("g");
    await expect(page.locator("[data-cell-id]")).toHaveCount(0);

    const canvas = page.locator("#main-content canvas");
    await expect(canvas).toBeVisible();
    await expect(page.getByText("test-2x2.png")).toBeVisible();

    await switchToolMode(page, "roi");
    await drawOnCanvas(page, canvas, { x: 20, y: 20 }, { x: 80, y: 80 });

    await expect(page.getByText("ROI Statistics")).toBeVisible();
  });

  test("line profile works after grid-to-single transition", async ({
    page,
  }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    await page.keyboard.press("g");
    await expect(page.locator("[data-cell-id]")).toHaveCount(0);

    const canvas = page.locator("#main-content canvas");
    await expect(canvas).toBeVisible();
    await expect(page.getByText("test-2x2.png")).toBeVisible();

    await switchToolMode(page, "line-profile");
    await drawOnCanvas(page, canvas, { x: 20, y: 50 }, { x: 80, y: 50 });

    await expect(page.getByText("Line Profile").first()).toBeVisible();
  });

  // --- Sidebar Panels in Grid Mode ---

  test("pixel inspector shows info on hover in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    const canvas = firstCell.locator("canvas");
    await canvas.hover();

    await expect(page.getByText("Position (y, x)")).toBeVisible();
    await expect(page.getByText("Color")).toBeVisible();
  });

  test("histogram chart visible in grid cell with image", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    await expect(
      page.locator('canvas[aria-label="Image color histogram"]'),
    ).toBeVisible();
  });

  test("image stats visible in grid cell with image", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    await expect(page.getByText("Image Stats")).toBeVisible();
  });

  test("EXIF panel shows no data for PNG in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    await expect(page.getByText("No EXIF data found.")).toBeVisible();
  });

  test("all sidebar panels visible in grid mode with image", async ({
    page,
  }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    await expect(page.getByText("Histogram")).toBeVisible();
    await expect(page.getByText("Image Stats")).toBeVisible();
    await expect(page.getByText("Pixel Inspector")).toBeVisible();
    await expect(page.getByText("EXIF Metadata")).toBeVisible();
  });

  // --- Grid Interaction Features ---

  test("active cell indicator updates when switching cells", async ({
    page,
  }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);
    await loadImageIntoGridCell(page, 1);

    const secondCell = page.locator("[data-cell-id]").nth(1);
    await secondCell.click();

    await expect(page.getByText(/Cell \[1, 2\]/)).toBeVisible();
  });

  test("position lock synchronizes zoom across cells", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);
    await loadImageIntoGridCell(page, 1);

    // Ensure position lock is enabled (aria-pressed="true" means locked)
    const lockToggle = page.getByRole("button", {
      name: /Lock Position|Unlock Position/,
    });
    if ((await lockToggle.getAttribute("aria-pressed")) !== "true") {
      await page.keyboard.press("k");
    }
    await expect(lockToggle).toHaveAttribute("aria-pressed", "true");

    const cell0 = page.locator("[data-cell-id]").first();
    const cell1 = page.locator("[data-cell-id]").nth(1);
    await cell0.click();

    const zoom0Before = await getCellZoom(cell0);
    const zoom1Before = await getCellZoom(cell1);

    await page.keyboard.press("+");

    await expect(cell0).not.toHaveAttribute("data-zoom", String(zoom0Before));
    await expect(cell1).not.toHaveAttribute("data-zoom", String(zoom1Before));
    const zoom0After = await getCellZoom(cell0);
    const zoom1After = await getCellZoom(cell1);
    expect(zoom0After).toBeGreaterThan(zoom0Before);
    expect(zoom1After).toBeGreaterThan(zoom1Before);
  });

  test("position lock disabled only zooms active cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoGridCell(page, 0);
    await loadImageIntoGridCell(page, 1);

    // Ensure position lock is disabled (aria-pressed="false" means unlocked)
    const lockToggle = page.getByRole("button", {
      name: /Lock Position|Unlock Position/,
    });
    if ((await lockToggle.getAttribute("aria-pressed")) !== "false") {
      await page.keyboard.press("k");
    }
    await expect(lockToggle).toHaveAttribute("aria-pressed", "false");

    const cell0 = page.locator("[data-cell-id]").first();
    const cell1 = page.locator("[data-cell-id]").nth(1);
    await cell0.click();
    // Wait for cell0 to become active before zooming
    await expect(cell0).toHaveAttribute("data-active", "true");

    const zoom0Before = await getCellZoom(cell0);
    const zoom1Before = await getCellZoom(cell1);

    await page.keyboard.press("+");

    await expect(cell0).not.toHaveAttribute("data-zoom", String(zoom0Before));
    await expect(cell1).toHaveAttribute("data-zoom", String(zoom1Before));
    const zoom0After = await getCellZoom(cell0);
    expect(zoom0After).toBeGreaterThan(zoom0Before);
  });

  // --- Sidebar After Single-to-Grid Transition ---

  test("pixel inspector works after single-to-grid transition", async ({
    page,
  }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    const canvas = firstCell.locator("canvas");
    await canvas.hover();

    await expect(page.getByText("Position (y, x)")).toBeVisible();
    await expect(page.getByText("Color")).toBeVisible();
  });

  test("histogram works after single-to-grid transition", async ({ page }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    await expect(
      page.locator('canvas[aria-label="Image color histogram"]'),
    ).toBeVisible();
  });

  test("image stats works after single-to-grid transition", async ({
    page,
  }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    await expect(page.getByText("Image Stats")).toBeVisible();
  });

  test("all sidebar panels visible after single-to-grid transition", async ({
    page,
  }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    await expect(page.getByText("Histogram")).toBeVisible();
    await expect(page.getByText("Image Stats")).toBeVisible();
    await expect(page.getByText("Pixel Inspector")).toBeVisible();
    await expect(page.getByText("EXIF Metadata")).toBeVisible();
  });

  // --- Sidebar After Grid-to-Single Transition ---

  test("pixel inspector works after grid-to-single transition", async ({
    page,
  }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    await page.keyboard.press("g");
    await expect(page.locator("[data-cell-id]")).toHaveCount(0);

    const canvas = page.locator("main canvas");
    await expect(canvas).toBeVisible();
    await expect(page.getByText("test-2x2.png")).toBeVisible();

    // Fit image to screen so the tiny 2x2 image is large enough to hover on
    await page.keyboard.press("0");
    await page.mouse.move(0, 0);
    await canvas.hover();

    await expect(page.getByText("Position (y, x)")).toBeVisible();
    await expect(page.getByText("Color")).toBeVisible();
  });

  test("histogram works after grid-to-single transition", async ({ page }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    await page.keyboard.press("g");
    await expect(page.locator("[data-cell-id]")).toHaveCount(0);
    await expect(page.locator("#main-content canvas")).toBeVisible();

    await expect(
      page.locator('canvas[aria-label="Image color histogram"]'),
    ).toBeVisible();
  });

  test("image stats works after grid-to-single transition", async ({
    page,
  }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    await page.keyboard.press("g");
    await expect(page.locator("[data-cell-id]")).toHaveCount(0);
    await expect(page.locator("#main-content canvas")).toBeVisible();

    await expect(page.getByText("Image Stats")).toBeVisible();
  });

  test("all sidebar panels visible after grid-to-single transition", async ({
    page,
  }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    await page.keyboard.press("g");
    await expect(page.locator("[data-cell-id]")).toHaveCount(0);
    await expect(page.locator("#main-content canvas")).toBeVisible();

    await expect(page.getByText("Histogram")).toBeVisible();
    await expect(page.getByText("Image Stats")).toBeVisible();
    await expect(page.getByText("Pixel Inspector")).toBeVisible();
    await expect(page.getByText("EXIF Metadata")).toBeVisible();
  });
});
