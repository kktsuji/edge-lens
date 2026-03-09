import path from "node:path";
import { expect, type Locator, type Page } from "@playwright/test";

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
 */
export async function switchToolMode(
  page: Page,
  mode: "navigate" | "roi" | "line-profile",
): Promise<void> {
  const labels: Record<string, string> = {
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
 * Reads the zoom percentage text from the toolbar as a number.
 */
export async function getZoomPercent(page: Page): Promise<number> {
  const text = await getZoomText(page);
  return parseInt(text.replace("%", ""), 10);
}

/**
 * Reads the zoom span text (e.g. "500%"), waiting for it to be visible.
 */
export async function getZoomText(page: Page): Promise<string> {
  const span = page.locator("span").filter({ hasText: /^\d+%$/ });
  await expect(span).toBeVisible();
  return (await span.textContent())!;
}
