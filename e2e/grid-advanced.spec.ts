import { test, expect } from "@playwright/test";
import path from "path";
import { drawOnCanvas, openGridMode, switchToolMode } from "./helpers.js";

const FIXTURE = path.resolve(import.meta.dirname, "fixtures/test-2x2.png");

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

  test("Escape exits grid mode", async ({ page }) => {
    // Use G key to enable grid directly
    await page.keyboard.press("g");
    await expect(page.locator("[data-cell-id]").first()).toBeVisible();

    // Navigate mode is default, so Escape should exit grid
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-cell-id]")).toHaveCount(0);
  });
});
