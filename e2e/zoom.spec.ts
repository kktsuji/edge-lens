import { test, expect } from "@playwright/test";
import path from "path";

const FIXTURE = path.resolve(__dirname, "fixtures/test-2x2.png");

test.describe("Zoom", () => {
  test("image canvas is present after loading", async ({ page }) => {
    await page.goto("/");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Open Image" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(FIXTURE);

    await expect(page.getByText("test-2x2.png")).toBeVisible();
    // Main canvas should be present
    await expect(page.locator("main canvas")).toBeVisible();
  });
});
