import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { FIXTURE, loadTestImage } from "./helpers.js";

test.describe("Accessibility", () => {
  test("no critical violations on empty state", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(critical).toHaveLength(0);
  });

  test("no critical violations with image loaded", async ({ page }) => {
    await page.goto("/");
    await loadTestImage(page, FIXTURE);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(critical).toHaveLength(0);
  });

  test("no critical violations in grid mode", async ({ page }) => {
    await page.goto("/");

    // Click body to ensure page focus for keyboard events
    await page.locator("body").click();
    // G key directly enables grid mode (default layout)
    await page.keyboard.press("g");
    await expect(page.locator("[data-cell-id]").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(critical).toHaveLength(0);
  });

  test("no critical violations with help dialog open", async ({ page }) => {
    await page.goto("/");

    // Click body to ensure page focus for keyboard events
    await page.locator("body").click();
    await page.keyboard.press("?");
    await expect(page.getByRole("dialog")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(critical).toHaveLength(0);
  });
});
