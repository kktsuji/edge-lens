import { test, expect } from "@playwright/test";
import { FIXTURE, loadTestImage, switchToolMode } from "./helpers.js";

test.describe("Toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("tool mode buttons visible after loading image", async ({ page }) => {
    await loadTestImage(page, FIXTURE);

    await expect(
      page.getByRole("button", { name: "Navigate (N)" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Line Profile (L)" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "ROI Selection (R)" }),
    ).toBeVisible();
  });

  test("navigate mode is active by default", async ({ page }) => {
    await loadTestImage(page, FIXTURE);

    const navBtn = page.getByRole("button", { name: "Navigate (N)" });
    await expect(navBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("switch to ROI mode via button click", async ({ page }) => {
    await loadTestImage(page, FIXTURE);
    await switchToolMode(page, "roi");

    const roiBtn = page.getByRole("button", { name: "ROI Selection (R)" });
    await expect(roiBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("switch to line-profile mode via button click", async ({ page }) => {
    await loadTestImage(page, FIXTURE);
    await switchToolMode(page, "line-profile");

    const lpBtn = page.getByRole("button", { name: "Line Profile (L)" });
    await expect(lpBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("tool buttons visible but disabled when no image loaded", async ({
    page,
  }) => {
    const navBtn = page.getByTestId("tool-navigate");
    const lpBtn = page.getByTestId("tool-line-profile");
    const roiBtn = page.getByTestId("tool-roi");

    await expect(navBtn).toBeVisible();
    await expect(navBtn).toBeDisabled();
    await expect(lpBtn).toBeVisible();
    await expect(lpBtn).toBeDisabled();
    await expect(roiBtn).toBeVisible();
    await expect(roiBtn).toBeDisabled();
  });
});
