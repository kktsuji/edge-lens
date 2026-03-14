import path from "node:path";
import { expect, type Locator, type Page } from "@playwright/test";

export const FIXTURE = path.resolve(
  import.meta.dirname,
  "fixtures/test-2x2.png",
);

export const FIXTURE_UNSUPPORTED = path.resolve(
  import.meta.dirname,
  "fixtures/test-unsupported.txt",
);

/**
 * Opens an image file via the file picker in #main-content and waits for it to load.
 */
export async function loadTestImage(
  page: Page,
  fixturePath: string,
): Promise<void> {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page
    .locator("#main-content")
    .getByRole("button", { name: "Open Image" })
    .click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(fixturePath);

  const fileName = path.basename(fixturePath);
  await expect(page.getByText(fileName)).toBeVisible();
}

/**
 * Clicks the toolbar button matching the given tool mode.
 * Keep in sync with ToolMode in src/types/index.ts
 */
export async function switchToolMode(
  page: Page,
  mode: "navigate" | "roi" | "line-profile",
): Promise<void> {
  const labels: Record<"navigate" | "roi" | "line-profile", string> = {
    navigate: "Navigate (N)",
    roi: "ROI Selection (R)",
    "line-profile": "Line Profile (L)",
  };
  await page.getByRole("button", { name: labels[mode] }).click();
}

/**
 * Draws on a canvas element from one point to another using %-based offsets.
 * Coordinates are relative to the canvas bounding box (0-100%).
 */
export async function drawOnCanvas(
  page: Page,
  canvas: Locator,
  startPct: { x: number; y: number },
  endPct: { x: number; y: number },
): Promise<void> {
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas bounding box not found");

  const startX = box.x + (box.width * startPct.x) / 100;
  const startY = box.y + (box.height * startPct.y) / 100;
  const endX = box.x + (box.width * endPct.x) / 100;
  const endY = box.y + (box.height * endPct.y) / 100;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();
}

/**
 * Opens grid mode by clicking the Grid View button and selecting 2x2 layout.
 */
export async function openGridMode(page: Page): Promise<void> {
  const gridBtn = page.getByRole("button", { name: "Grid View (G)" });
  await gridBtn.click();
  // Click a layout preset (e.g., 2x2) to activate grid
  const dropdown = page.locator("#grid-layout-dropdown");
  await expect(dropdown).toBeVisible();
  // Click the 2x2 preset button (labels use "x" not "×")
  await dropdown.getByRole("button", { name: "2 x 2" }).click();
  // Wait for grid cells to appear
  await expect(page.locator("[data-cell-id]").first()).toBeVisible();
}

/**
 * Loads an image into a grid cell by index (0-based).
 */
export async function loadImageIntoGridCell(
  page: Page,
  cellIndex: number,
): Promise<void> {
  const cell = page.locator("[data-cell-id]").nth(cellIndex);
  const fileChooserPromise = page.waitForEvent("filechooser");
  await cell.getByRole("button", { name: "Open Image" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(FIXTURE);
  await expect(cell.locator("canvas")).toBeVisible();
}

/**
 * Press "1" to set zoom to 100% and return the zoom span locator.
 */
export async function resetZoomTo100(page: Page): Promise<Locator> {
  await page.keyboard.press("1");
  const zoomSpan = page.locator("span").filter({ hasText: /^\d+%$/ });
  await expect(zoomSpan).toHaveText("100%");
  return zoomSpan;
}

/**
 * Reads the zoom percentage from the toolbar as a number.
 */
export async function getZoomPercent(page: Page): Promise<number> {
  const span = page.locator("span").filter({ hasText: /^\d+%$/ });
  await expect(span).toBeVisible();
  const text = await span.textContent();
  if (text === null) throw new Error("Zoom span has no text content");
  return parseInt(text.replace("%", ""), 10);
}

/**
 * Reads the data-zoom attribute from a grid cell as a number.
 */
export async function getCellZoom(cell: Locator): Promise<number> {
  const val = await cell.getAttribute("data-zoom");
  if (val === null) throw new Error("data-zoom attribute not found");
  return parseInt(val, 10);
}
