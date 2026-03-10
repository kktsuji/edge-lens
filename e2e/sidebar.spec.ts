import { test, expect } from "@playwright/test";
import { FIXTURE, loadTestImage } from "./helpers.js";

test.describe("Sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("sidebar visible on desktop viewport", async ({ page }) => {
    await expect(page.locator("aside")).toBeVisible();
  });

  test("sidebar shows panels with image loaded", async ({ page }) => {
    await loadTestImage(page, FIXTURE);

    await expect(page.getByText("Histogram")).toBeVisible();
    await expect(page.getByText("Image Stats")).toBeVisible();
    await expect(page.getByText("Pixel Inspector")).toBeVisible();
    await expect(page.getByText("EXIF Metadata")).toBeVisible();
  });

  test("sidebar shows keyboard shortcuts when no image", async ({ page }) => {
    await expect(page.getByText("Keyboard Shortcuts")).toBeVisible();
  });
});
