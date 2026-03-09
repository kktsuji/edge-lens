import { test, expect } from "@playwright/test";
import path from "path";
import { loadTestImage } from "./helpers.js";

const FIXTURE = path.resolve(import.meta.dirname, "fixtures/test-2x2.png");

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

  test("rejects unsupported file format", async ({ page }) => {
    // Create a temporary text file to simulate unsupported format
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .locator("#main-content")
      .getByRole("button", { name: "Open Image" })
      .click();
    const fileChooser = await fileChooserPromise;

    const os = await import("os");
    const fs = await import("fs");
    const tempFile = path.join(
      os.tmpdir(),
      `test-unsupported-${process.pid}-${Date.now()}.txt`,
    );
    fs.writeFileSync(tempFile, "not an image");
    try {
      await fileChooser.setFiles(tempFile);
      await expect(
        page.getByText("Unsupported format. Please use JPEG or PNG."),
      ).toBeVisible();
    } finally {
      fs.unlinkSync(tempFile);
    }
  });
});
