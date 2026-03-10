const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

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
