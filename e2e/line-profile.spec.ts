import { test, expect } from "@playwright/test";
import path from "path";
import { drawOnCanvas, loadTestImage, switchToolMode } from "./helpers.js";

const FIXTURE = path.resolve(import.meta.dirname, "fixtures/test-2x2.png");

test.describe("Line Profile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadTestImage(page, FIXTURE);
  });

  test("placeholder shown in line-profile mode before drawing", async ({
    page,
  }) => {
    await switchToolMode(page, "line-profile");

    await expect(
      page.getByText("Draw a line on the image to plot its pixel values."),
    ).toBeVisible();
  });

  test("drawing line shows chart", async ({ page }) => {
    await switchToolMode(page, "line-profile");

    const canvas = page.locator("main canvas");
    await drawOnCanvas(page, canvas, { x: 20, y: 50 }, { x: 80, y: 50 });

    // The lazy-loaded chart should appear
    await expect(page.getByText("Line Profile").first()).toBeVisible();
    // Chart canvas should render
    await expect(page.locator("aside canvas").first()).toBeVisible();
  });

  test("clear button returns to placeholder", async ({ page }) => {
    await switchToolMode(page, "line-profile");

    const canvas = page.locator("main canvas");
    await drawOnCanvas(page, canvas, { x: 20, y: 50 }, { x: 80, y: 50 });

    await expect(page.locator("aside canvas").first()).toBeVisible();

    await page
      .getByRole("button", { name: "Clear Line Profile (Esc)" })
      .click();
    await expect(
      page.getByText("Draw a line on the image to plot its pixel values."),
    ).toBeVisible();
  });

  test("Escape clears line profile", async ({ page }) => {
    await switchToolMode(page, "line-profile");

    const canvas = page.locator("main canvas");
    await drawOnCanvas(page, canvas, { x: 20, y: 50 }, { x: 80, y: 50 });

    await expect(page.locator("aside canvas").first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(
      page.getByText("Draw a line on the image to plot its pixel values."),
    ).toBeVisible();
  });
});
