import { test, expect } from "@playwright/test";
import path from "path";
import { loadTestImage } from "./helpers.js";

const FIXTURE = path.resolve(import.meta.dirname, "fixtures/test-2x2.png");

test.describe("Pixel Inspector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadTestImage(page, FIXTURE);
  });

  test("shows placeholder when not hovering", async ({ page }) => {
    await expect(
      page.getByText("Hover over the image to inspect pixels."),
    ).toBeVisible();
  });

  test("shows RGBA values on hover over canvas", async ({ page }) => {
    const canvas = page.locator("main canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Hover at center of canvas — image is always centered here
    await canvas.hover();

    await expect(page.getByText("Position (y, x)")).toBeVisible();
    await expect(page.getByText("Color")).toBeVisible();
  });

  test("pixel info resets when mouse leaves canvas", async ({ page }) => {
    const canvas = page.locator("main canvas");

    // Hover at center of canvas — pixel info appears
    await canvas.hover();
    await expect(page.getByText("Position (y, x)")).toBeVisible();

    // Move mouse away from the canvas — pixel info returns to placeholder
    await page.mouse.move(0, 0);
    await expect(
      page.getByText("Hover over the image to inspect pixels."),
    ).toBeVisible();
  });
});
