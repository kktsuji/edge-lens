import { describe, it, expect } from "vitest";
import { validateImageFile } from "../validation";

function createFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

describe("validateImageFile", () => {
  it("accepts a valid JPEG file", () => {
    const file = createFile("photo.jpg", "image/jpeg", 1024);
    expect(validateImageFile(file)).toEqual({ valid: true });
  });

  it("accepts a valid PNG file", () => {
    const file = createFile("photo.png", "image/png", 1024);
    expect(validateImageFile(file)).toEqual({ valid: true });
  });

  it("rejects unsupported format", () => {
    const file = createFile("photo.gif", "image/gif", 1024);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("error.unsupportedFormat");
  });

  it("rejects file exceeding 50 MB", () => {
    const file = createFile("big.png", "image/png", 51 * 1024 * 1024);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("error.fileTooLarge");
  });

  it("accepts file exactly at 50 MB", () => {
    const file = createFile("exact.png", "image/png", 50 * 1024 * 1024);
    expect(validateImageFile(file)).toEqual({ valid: true });
  });
});
