import { describe, it, expect, vi } from "vitest";
import {
  validateImageFile,
  handleFileSelection,
  verifyMagicBytes,
} from "../validation";

function createFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

// JPEG magic bytes: FF D8 FF
const JPEG_HEADER = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
// PNG magic bytes: 89 50 4E 47
const PNG_HEADER = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function createFileWithMagic(
  name: string,
  type: string,
  header: Uint8Array,
  sizeBytes = 1024,
): File {
  const buffer = new Uint8Array(sizeBytes);
  buffer.set(header);
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

describe("verifyMagicBytes", () => {
  it("returns true for JPEG magic bytes", async () => {
    const file = createFileWithMagic("photo.jpg", "image/jpeg", JPEG_HEADER);
    expect(await verifyMagicBytes(file)).toBe(true);
  });

  it("returns true for PNG magic bytes", async () => {
    const file = createFileWithMagic("photo.png", "image/png", PNG_HEADER);
    expect(await verifyMagicBytes(file)).toBe(true);
  });

  it("returns false for non-image content", async () => {
    const file = createFile("fake.jpg", "image/jpeg", 1024);
    expect(await verifyMagicBytes(file)).toBe(false);
  });
});

describe("handleFileSelection", () => {
  it("calls loadFn and clears error on valid file", async () => {
    const file = createFileWithMagic("photo.jpg", "image/jpeg", JPEG_HEADER);
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
    const file = createFileWithMagic("photo.png", "image/png", PNG_HEADER);
    const loadFn = vi.fn().mockRejectedValue(new Error("fail"));
    const setError = vi.fn();

    await handleFileSelection(file, loadFn, setError);

    expect(setError).toHaveBeenCalledWith(null);
    expect(setError).toHaveBeenCalledWith("error.unsupportedFormat");
  });

  it("rejects file with valid MIME type but wrong magic bytes", async () => {
    const file = createFile("fake.jpg", "image/jpeg", 1024);
    const loadFn = vi.fn();
    const setError = vi.fn();

    await handleFileSelection(file, loadFn, setError);

    expect(setError).toHaveBeenCalledWith("error.unsupportedFormat");
    expect(loadFn).not.toHaveBeenCalled();
  });
});
