import { test, expect } from "@playwright/test";
import path from "path";
import {
  drawOnCanvas,
  loadTestImage,
  openGridMode,
  switchToolMode,
} from "./helpers.js";

const FIXTURE = path.resolve(import.meta.dirname, "fixtures/test-2x2.png");

/** Read zoom span text, waiting for it to be visible. */
async function readZoomText(page: import("@playwright/test").Page) {
  const span = page.locator("span").filter({ hasText: /^\d+%$/ });
  await expect(span).toBeVisible();
  return (await span.textContent())!;
}

/**
 * Helper to load an image into the first grid cell.
 */
async function loadImageIntoFirstCell(page: import("@playwright/test").Page) {
  const firstCell = page.locator("[data-cell-id]").first();
  const fileChooserPromise = page.waitForEvent("filechooser");
  await firstCell.getByRole("button", { name: "Open Image" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(FIXTURE);
  await expect(firstCell.locator("canvas")).toBeVisible();
}

/**
 * Helper to load an image into the second grid cell.
 */
async function loadImageIntoSecondCell(page: import("@playwright/test").Page) {
  const secondCell = page.locator("[data-cell-id]").nth(1);
  const fileChooserPromise = page.waitForEvent("filechooser");
  await secondCell.getByRole("button", { name: "Open Image" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(FIXTURE);
  await expect(secondCell.locator("canvas")).toBeVisible();
}

test.describe("Grid Advanced", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("ROI selection works in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoFirstCell(page);

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
    await loadImageIntoFirstCell(page);

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
    await loadImageIntoFirstCell(page);
    const cell = page.locator("[data-cell-id]").first();
    await cell.click();

    const initialZoom = await cell.getAttribute("data-zoom");
    await page.keyboard.press("+");

    await expect(cell).not.toHaveAttribute("data-zoom", initialZoom!);
  });

  test("zoom out with - key works in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoFirstCell(page);
    const cell = page.locator("[data-cell-id]").first();
    await cell.click();

    const initialZoom = await cell.getAttribute("data-zoom");
    await page.keyboard.press("-");

    await expect(cell).not.toHaveAttribute("data-zoom", initialZoom!);
  });

  test("actual size (100%) with 1 key works in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoFirstCell(page);
    const cell = page.locator("[data-cell-id]").first();
    await cell.click();

    await page.keyboard.press("1");

    await expect(cell).toHaveAttribute("data-zoom", "100");
  });

  test("fit to screen with 0 key works in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoFirstCell(page);
    const cell = page.locator("[data-cell-id]").first();
    await cell.click();

    // Zoom in first to change from default
    const initialZoom = await cell.getAttribute("data-zoom");
    await page.keyboard.press("+");
    await expect(cell).not.toHaveAttribute("data-zoom", initialZoom!);

    const zoomedValue = await cell.getAttribute("data-zoom");
    await page.keyboard.press("0");
    await expect(cell).not.toHaveAttribute("data-zoom", zoomedValue!);
  });

  // --- Tools Work After Single-to-Grid Transition ---

  test("zoom works after single-to-grid transition", async ({ page }) => {
    await loadTestImage(page, FIXTURE);
    await openGridMode(page);
    const cell = page.locator("[data-cell-id]").first();
    await cell.click();

    const initialZoom = await cell.getAttribute("data-zoom");
    await page.keyboard.press("+");

    await expect(cell).not.toHaveAttribute("data-zoom", initialZoom!);
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

    const initialText = await readZoomText(page);
    await page.keyboard.press("+");

    const span = page.locator("span").filter({ hasText: /^\d+%$/ });
    await expect(span).not.toHaveText(initialText);
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
    await loadImageIntoFirstCell(page);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    const canvas = firstCell.locator("canvas");
    await canvas.hover();

    await expect(page.getByText("Position (y, x)")).toBeVisible();
    await expect(page.getByText("Color")).toBeVisible();
  });

  test("histogram chart visible in grid cell with image", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoFirstCell(page);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    await expect(
      page.locator('canvas[aria-label="Image color histogram"]'),
    ).toBeVisible();
  });

  test("image stats visible in grid cell with image", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoFirstCell(page);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    await expect(page.getByText("Image Stats")).toBeVisible();
  });

  test("EXIF panel shows no data for PNG in grid cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoFirstCell(page);
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    await expect(page.getByText("No EXIF data found.")).toBeVisible();
  });

  test("all sidebar panels visible in grid mode with image", async ({
    page,
  }) => {
    await openGridMode(page);
    await loadImageIntoFirstCell(page);
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
    await loadImageIntoFirstCell(page);
    await loadImageIntoSecondCell(page);

    const secondCell = page.locator("[data-cell-id]").nth(1);
    await secondCell.click();

    await expect(page.getByText(/Cell \[1, 2\]/)).toBeVisible();
  });

  test("position lock synchronizes zoom across cells", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoFirstCell(page);
    await loadImageIntoSecondCell(page);

    const cell0 = page.locator("[data-cell-id]").first();
    const cell1 = page.locator("[data-cell-id]").nth(1);
    await cell0.click();

    const zoom0Before = await cell0.getAttribute("data-zoom");
    const zoom1Before = await cell1.getAttribute("data-zoom");

    await page.keyboard.press("+");

    await expect(cell0).not.toHaveAttribute("data-zoom", zoom0Before!);
    await expect(cell1).not.toHaveAttribute("data-zoom", zoom1Before!);
  });

  test("position lock disabled only zooms active cell", async ({ page }) => {
    await openGridMode(page);
    await loadImageIntoFirstCell(page);
    await loadImageIntoSecondCell(page);

    // Disable position lock
    await page.keyboard.press("k");

    const cell0 = page.locator("[data-cell-id]").first();
    const cell1 = page.locator("[data-cell-id]").nth(1);
    await cell0.click();

    const zoom0Before = await cell0.getAttribute("data-zoom");
    const zoom1Before = await cell1.getAttribute("data-zoom");

    await page.keyboard.press("+");

    await expect(cell0).not.toHaveAttribute("data-zoom", zoom0Before!);
    await expect(cell1).toHaveAttribute("data-zoom", zoom1Before!);
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
