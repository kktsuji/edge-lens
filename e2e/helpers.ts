import { expect, type Page } from "@playwright/test";

/**
 * Opens an image file via the file picker in #main-content and waits for it to load.
 */
export async function loadTestImage(
  page: Page,
  fixturePath: string,
): Promise<void> {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page
    .locator("#main-content")
    .getByRole("button", { name: "Open Image" })
    .click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(fixturePath);

  const fileName = fixturePath.split("/").pop() ?? fixturePath;
  await expect(page.getByText(fileName)).toBeVisible();
}
