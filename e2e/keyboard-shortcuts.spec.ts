import { test, expect } from "@playwright/test";
import path from "path";
import { loadTestImage } from "./helpers.js";

const FIXTURE = path.resolve(import.meta.dirname, "fixtures/test-2x2.png");

test.describe("Keyboard Shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadTestImage(page, FIXTURE);
  });

  test("R switches to ROI mode", async ({ page }) => {
    await page.keyboard.press("r");

    const roiBtn = page.getByRole("button", { name: "ROI Selection (R)" });
    await expect(roiBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("L switches to line-profile mode", async ({ page }) => {
    await page.keyboard.press("l");

    const lpBtn = page.getByRole("button", { name: "Line Profile (L)" });
    await expect(lpBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("N switches to navigate mode", async ({ page }) => {
    // First switch away from navigate
    await page.keyboard.press("r");
    await expect(
      page.getByRole("button", { name: "ROI Selection (R)" }),
    ).toHaveAttribute("aria-pressed", "true");

    // Switch back to navigate
    await page.keyboard.press("n");
    const navBtn = page.getByRole("button", { name: "Navigate (N)" });
    await expect(navBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("? opens shortcuts help dialog", async ({ page }) => {
    await page.keyboard.press("?");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Keyboard Shortcuts")).toBeVisible();
  });

  test("Escape closes help dialog", async ({ page }) => {
    await page.keyboard.press("?");
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("Escape closes image in navigate mode", async ({ page }) => {
    await page.keyboard.press("Escape");

    await expect(page.getByText("Drop an image here")).toBeVisible();
  });

  test("Ctrl+O opens file picker", async ({ page }) => {
    // Dispatch Ctrl+O via JS to avoid browser shortcut interception
    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser", { timeout: 5000 }),
      page.evaluate(() => {
        const event = new KeyboardEvent("keydown", {
          key: "o",
          code: "KeyO",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(event);
      }),
    ]);
    expect(fileChooser).toBeTruthy();
  });

  test("+/- keys change zoom percentage", async ({ page }) => {
    const zoomSpan = page.locator("span").filter({ hasText: /^\d+%$/ });

    // Set to 100% first (verifies canvas ref and keyboard handler work)
    await page.keyboard.press("1");
    await expect(zoomSpan).toHaveText("100%");

    // Zoom in with "="  (same as "+", avoids shift key issues)
    await page.keyboard.press("=");
    await expect(zoomSpan).not.toHaveText("100%");

    const zoomedInText = await zoomSpan.textContent();

    // Zoom out
    await page.keyboard.press("-");
    await expect(zoomSpan).not.toHaveText(zoomedInText!);
  });
});
