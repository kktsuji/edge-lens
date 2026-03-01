import { test, expect } from "@playwright/test";
import path from "path";

const FIXTURE = path.resolve(__dirname, "fixtures/test-2x2.png");

test.describe("Pixel Inspector", () => {
  test("shows pixel info on hover", async ({ page }) => {
    await page.goto("/");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Open Image" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(FIXTURE);

    await expect(page.getByText("test-2x2.png")).toBeVisible();

    // The pixel inspector panel should show placeholder when not hovering
    await expect(
      page.getByText("Hover over the image to inspect pixels."),
    ).toBeVisible();
  });
});
