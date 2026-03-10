import { test, expect } from "@playwright/test";
import { FIXTURE, loadTestImage } from "./helpers.js";

test.describe("Histogram", () => {
  test("shows placeholder when no image loaded", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("Load an image to view its histogram."),
    ).toBeVisible();
  });

  test("renders histogram chart when image loaded", async ({ page }) => {
    await page.goto("/");
    await loadTestImage(page, FIXTURE);

    await expect(
      page.locator('canvas[aria-label="Image color histogram"]'),
    ).toBeVisible();
  });
});
