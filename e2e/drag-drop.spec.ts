import { test, expect } from "@playwright/test";
import { FIXTURE, loadTestImage } from "./helpers.js";

test.describe("Drag and Drop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("drop image on drop zone loads it", async ({ page }) => {
    // Dispatch drag events on the DropZone's container div (first child of main)
    await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, 2, 2);
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png"),
      );
      const file = new File([blob], "dropped.png", {
        type: "image/png",
      });
      const dt = new DataTransfer();
      dt.items.add(file);

      // Target the DropZone div (first child of #main-content)
      const target = document.querySelector("#main-content")?.firstElementChild;
      if (!target) throw new Error("DropZone element not found");
      target.dispatchEvent(
        new DragEvent("dragover", {
          dataTransfer: dt,
          bubbles: true,
          cancelable: true,
        }),
      );
      target.dispatchEvent(
        new DragEvent("drop", {
          dataTransfer: dt,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    // Image should load — canvas appears
    await expect(page.locator("main canvas")).toBeVisible({
      timeout: 10000,
    });
  });

  test("drop image on canvas replaces current image", async ({ page }) => {
    await loadTestImage(page, FIXTURE);
    await expect(page.locator("main canvas")).toBeVisible();

    // Drop on the wrapper div containing the canvas (first child of main)
    await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 4;
      canvas.height = 4;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "blue";
      ctx.fillRect(0, 0, 4, 4);
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png"),
      );
      const file = new File([blob], "replaced.png", {
        type: "image/png",
      });
      const dt = new DataTransfer();
      dt.items.add(file);

      const target = document.querySelector("#main-content")?.firstElementChild;
      if (!target) throw new Error("Canvas wrapper not found");
      target.dispatchEvent(
        new DragEvent("dragover", {
          dataTransfer: dt,
          bubbles: true,
          cancelable: true,
        }),
      );
      target.dispatchEvent(
        new DragEvent("drop", {
          dataTransfer: dt,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    // The replaced image should be visible with its filename
    await expect(page.locator("main canvas")).toBeVisible();
    await expect(page.getByText("replaced.png")).toBeVisible();
    // Original image filename should no longer be displayed
    await expect(page.getByText("test-2x2.png")).toBeHidden();
  });
});
