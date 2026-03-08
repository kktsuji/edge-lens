import { test, expect } from "@playwright/test";
import path from "path";
import { loadTestImage } from "./helpers.js";

const FIXTURE = path.resolve(import.meta.dirname, "fixtures/test-2x2.png");

test.describe("Zoom", () => {
  test("image canvas is present after loading", async ({ page }) => {
    await page.goto("/");
    await loadTestImage(page, FIXTURE);

    // Main canvas should be present
    await expect(page.locator("main canvas")).toBeVisible();
  });
});
