const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Magic byte signatures for supported formats
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file and load it via the provided function.
 * Sets error state on validation failure or load error.
 */
export async function handleFileSelection(
  file: File,
  loadFn: (file: File) => Promise<void>,
  setError: (error: string | null) => void,
): Promise<void> {
  setError(null);
  const result = validateImageFile(file);
  if (!result.valid) {
    setError(result.error!);
    return;
  }
  const magicOk = await verifyMagicBytes(file);
  if (!magicOk) {
    setError("error.unsupportedFormat");
    return;
  }
  try {
    await loadFn(file);
  } catch {
    setError("error.unsupportedFormat");
  }
}

export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "error.unsupportedFormat" };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: "error.fileTooLarge" };
  }

  return { valid: true };
}

/**
 * Verify file content matches its claimed MIME type by checking magic bytes.
 * Returns true if the file header matches JPEG or PNG signatures.
 */
export function verifyMagicBytes(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const header = new Uint8Array(reader.result as ArrayBuffer);
      const matchesJpeg = JPEG_MAGIC.every((b, i) => header[i] === b);
      const matchesPng = PNG_MAGIC.every((b, i) => header[i] === b);
      resolve(matchesJpeg || matchesPng);
    };
    reader.onerror = () => {
      // If reading fails, fall through to let createImageBitmap handle it
      resolve(true);
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}
