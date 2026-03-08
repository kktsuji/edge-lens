import { test, expect } from "@playwright/test";
import path from "path";
import { loadTestImage } from "./helpers.js";

const FIXTURE = path.resolve(import.meta.dirname, "fixtures/test-2x2.png");

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
