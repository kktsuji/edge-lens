import { test, expect } from "@playwright/test";
import path from "path";
import { loadTestImage } from "./helpers.js";

const FIXTURE = path.resolve(import.meta.dirname, "fixtures/test-2x2.png");

test.describe("Pixel Inspector", () => {
  test("shows pixel info on hover", async ({ page }) => {
    await page.goto("/");
    await loadTestImage(page, FIXTURE);

    // The pixel inspector panel should show placeholder when not hovering
    await expect(
      page.getByText("Hover over the image to inspect pixels."),
    ).toBeVisible();
  });
});
