import { test, expect } from "@playwright/test";
import { FIXTURE, FIXTURE_UNSUPPORTED, loadTestImage } from "./helpers.js";

test.describe("Image Loader", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows drop zone on initial load", async ({ page }) => {
    await expect(page.getByText("Drop an image here")).toBeVisible();
  });

  test("opens image via file picker", async ({ page }) => {
    await loadTestImage(page, FIXTURE);

    await expect(page.getByText("2×2")).toBeVisible();
  });

  test("closes image and returns to drop zone", async ({ page }) => {
    await loadTestImage(page, FIXTURE);

    await page.getByRole("button", { name: "Close Image" }).click();
    await expect(page.getByText("Drop an image here")).toBeVisible();
  });

  test("close button visible but disabled when no image loaded", async ({
    page,
  }) => {
    const closeBtn = page.getByTestId("close-button");
    await expect(closeBtn).toBeVisible();
    await expect(closeBtn).toBeDisabled();
  });

  test("rejects unsupported file format", async ({ page }) => {
    // Create a temporary text file to simulate unsupported format
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .locator("#main-content")
      .getByRole("button", { name: "Open Image" })
      .click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles(FIXTURE_UNSUPPORTED);
    await expect(
      page.getByText("Unsupported format. Please use JPEG or PNG."),
    ).toBeVisible();
  });
});
