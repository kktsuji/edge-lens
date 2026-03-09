import { test, expect } from "@playwright/test";
import path from "path";
import { openGridMode } from "./helpers.js";

const FIXTURE = path.resolve(import.meta.dirname, "fixtures/test-2x2.png");

test.describe("Grid View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("G key toggles grid mode on/off", async ({ page }) => {
    // G key directly enables grid mode (default 1x2 layout)
    await page.keyboard.press("g");
    await expect(page.locator("[data-cell-id]").first()).toBeVisible();

    // Escape in navigate mode exits grid
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-cell-id]")).toHaveCount(0);
  });

  test("correct cell count for 2x2 layout (4 cells)", async ({ page }) => {
    await openGridMode(page);

    await expect(page.locator("[data-cell-id]")).toHaveCount(4);
  });

  test("correct cell count for 1x2 layout (2 cells)", async ({ page }) => {
    const gridBtn = page.getByRole("button", { name: "Grid View (G)" });
    await gridBtn.click();
    const dropdown = page.locator("#grid-layout-dropdown");
    await expect(dropdown).toBeVisible();
    await dropdown.getByRole("button", { name: "1 x 2" }).click();

    await expect(page.locator("[data-cell-id]")).toHaveCount(2);
  });

  test("load image into grid cell via file picker", async ({ page }) => {
    await openGridMode(page);

    // Click "Open Image" in the first empty cell
    const firstCell = page.locator("[data-cell-id]").first();
    const fileChooserPromise = page.waitForEvent("filechooser");
    await firstCell.getByRole("button", { name: "Open Image" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(FIXTURE);

    // Canvas should appear in the cell
    await expect(firstCell.locator("canvas")).toBeVisible();
  });

  test("K key toggles position lock", async ({ page }) => {
    await openGridMode(page);

    // positionLocked defaults to true, so it starts locked
    await expect(
      page.getByRole("button", { name: "Unlock Position (K)" }),
    ).toBeVisible();

    await page.keyboard.press("k");
    await expect(
      page.getByRole("button", { name: "Lock Position (K)" }),
    ).toBeVisible();

    await page.keyboard.press("k");
    await expect(
      page.getByRole("button", { name: "Unlock Position (K)" }),
    ).toBeVisible();
  });

  test("lock button visible in toolbar when grid active", async ({ page }) => {
    // Lock button should not be visible before grid mode
    await expect(
      page.getByRole("button", { name: /Lock Position|Unlock Position/ }),
    ).toBeHidden();

    await openGridMode(page);

    await expect(
      page.getByRole("button", { name: /Lock Position|Unlock Position/ }),
    ).toBeVisible();
  });

  test("active cell has visual indicator", async ({ page }) => {
    await openGridMode(page);

    // Click a cell to activate it
    const firstCell = page.locator("[data-cell-id]").first();
    await firstCell.click();

    // The active cell indicator should show in the sidebar
    await expect(page.getByText("Cell")).toBeVisible();
  });
});
