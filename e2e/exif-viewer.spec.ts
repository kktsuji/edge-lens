import { test, expect } from "@playwright/test";
import path from "path";
import { loadTestImage } from "./helpers.js";

const FIXTURE = path.resolve(import.meta.dirname, "fixtures/test-2x2.png");

test.describe("EXIF Viewer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("placeholder when no image loaded", async ({ page }) => {
    await expect(
      page.getByText("Load an image to view its metadata."),
    ).toBeVisible();
  });

  test("No EXIF data found for PNG without EXIF", async ({ page }) => {
    await loadTestImage(page, FIXTURE);

    await expect(page.getByText("No EXIF data found.")).toBeVisible();
  });
});
