import { test, expect } from "@playwright/test";
import path from "path";

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

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .locator("#main-content")
      .getByRole("button", { name: "Open Image" })
      .click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(FIXTURE);

    await expect(page.getByText("test-2x2.png")).toBeVisible();

    // Chart.js renders a canvas element for the histogram
    await expect(page.locator("canvas")).toHaveCount(2); // main canvas + histogram canvas
  });
});
