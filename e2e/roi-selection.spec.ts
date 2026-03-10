import { test, expect } from "@playwright/test";
import {
  FIXTURE,
  drawOnCanvas,
  loadTestImage,
  switchToolMode,
} from "./helpers.js";

async function switchToRoi(page: import("@playwright/test").Page) {
  await switchToolMode(page, "roi");
  await expect(
    page.getByRole("button", { name: "ROI Selection (R)" }),
  ).toHaveAttribute("aria-pressed", "true");
}

test.describe("ROI Selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadTestImage(page, FIXTURE);
  });

  test("ROI stats panel not shown without selection", async ({ page }) => {
    await expect(page.getByText("ROI Statistics")).toBeHidden();
  });

  test("drawing ROI shows stats panel with Mean/Median/StdDev", async ({
    page,
  }) => {
    await switchToRoi(page);

    const canvas = page.locator("main canvas");
    await drawOnCanvas(page, canvas, { x: 30, y: 30 }, { x: 70, y: 70 });

    // Scope assertions to the ROI Statistics panel (grandparent of the heading)
    const roiPanel = page
      .getByText("ROI Statistics")
      .locator("..")
      .locator("..");
    await expect(roiPanel).toBeVisible();
    await expect(roiPanel.getByText("Mean")).toBeVisible();
    await expect(roiPanel.getByText("Median")).toBeVisible();
    await expect(roiPanel.getByText("Std Dev")).toBeVisible();
  });

  test("ROI stats show position and size", async ({ page }) => {
    await switchToRoi(page);

    const canvas = page.locator("main canvas");
    await drawOnCanvas(page, canvas, { x: 30, y: 30 }, { x: 70, y: 70 });

    await expect(page.getByText("ROI Statistics")).toBeVisible();
    await expect(page.getByText("Position")).toBeVisible();
    await expect(page.getByText("Size")).toBeVisible();
    await expect(page.getByText(/\d+ × \d+ px/)).toBeVisible();
  });

  test("clear ROI button removes selection", async ({ page }) => {
    await switchToRoi(page);

    const canvas = page.locator("main canvas");
    await drawOnCanvas(page, canvas, { x: 30, y: 30 }, { x: 70, y: 70 });

    await expect(page.getByText("ROI Statistics")).toBeVisible();

    await page
      .getByRole("button", { name: "Clear ROI Selection (Esc)" })
      .click();
    await expect(page.getByText("ROI Statistics")).toBeHidden();
  });

  test("Escape clears ROI", async ({ page }) => {
    await switchToRoi(page);

    const canvas = page.locator("main canvas");
    await drawOnCanvas(page, canvas, { x: 30, y: 30 }, { x: 70, y: 70 });

    await expect(page.getByText("ROI Statistics")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByText("ROI Statistics")).toBeHidden();
  });
});
