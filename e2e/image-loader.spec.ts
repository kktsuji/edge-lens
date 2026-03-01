import { test, expect } from "@playwright/test";
import path from "path";

const FIXTURE = path.resolve(__dirname, "fixtures/test-2x2.png");

test.describe("Image Loader", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows drop zone on initial load", async ({ page }) => {
    await expect(page.getByText("Drop an image here")).toBeVisible();
  });

  test("opens image via file picker", async ({ page }) => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Open Image" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(FIXTURE);

    // Image info should appear in toolbar
    await expect(page.getByText("test-2x2.png")).toBeVisible();
    await expect(page.getByText("2×2")).toBeVisible();
  });

  test("closes image and returns to drop zone", async ({ page }) => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Open Image" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(FIXTURE);

    await expect(page.getByText("test-2x2.png")).toBeVisible();
    await page.getByRole("button", { name: "Close Image" }).click();
    await expect(page.getByText("Drop an image here")).toBeVisible();
  });
});
