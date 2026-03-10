import { describe, it, expect, vi } from "vitest";
import { validateImageFile, handleFileSelection } from "../validation";

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

describe("handleFileSelection", () => {
  it("calls loadFn and clears error on valid file", async () => {
    const file = createFile("photo.jpg", "image/jpeg", 1024);
    const loadFn = vi.fn().mockResolvedValue(undefined);
    const setError = vi.fn();

    await handleFileSelection(file, loadFn, setError);

    expect(setError).toHaveBeenCalledWith(null);
    expect(loadFn).toHaveBeenCalledWith(file);
  });

  it("sets error and skips loadFn on invalid file", async () => {
    const file = createFile("photo.gif", "image/gif", 1024);
    const loadFn = vi.fn();
    const setError = vi.fn();

    await handleFileSelection(file, loadFn, setError);

    expect(setError).toHaveBeenCalledWith(null);
    expect(setError).toHaveBeenCalledWith("error.unsupportedFormat");
    expect(loadFn).not.toHaveBeenCalled();
  });

  it("sets error when loadFn throws", async () => {
    const file = createFile("photo.png", "image/png", 1024);
    const loadFn = vi.fn().mockRejectedValue(new Error("fail"));
    const setError = vi.fn();

    await handleFileSelection(file, loadFn, setError);

    expect(setError).toHaveBeenCalledWith(null);
    expect(setError).toHaveBeenCalledWith("error.unsupportedFormat");
  });
});
