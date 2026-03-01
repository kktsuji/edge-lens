const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
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
