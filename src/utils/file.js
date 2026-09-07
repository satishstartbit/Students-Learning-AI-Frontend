import { formatFileSize } from './format';

/**
 * File and image validation for assignment photo/screenshot uploads (OCR
 * input). Client-side checks are a UX convenience - the API validates again.
 */
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const DOCUMENT_MIME_TYPES = ['application/pdf'];

export const DEFAULT_MAX_FILE_SIZE = Number(
  import.meta.env.VITE_MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024
);

export const getFileExtension = (filename = '') => {
  const name = String(filename);
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
};

export const isImage = (file) => Boolean(file) && IMAGE_MIME_TYPES.includes(file.type);

export function validateFileSize(file, maxBytes = DEFAULT_MAX_FILE_SIZE) {
  if (!file) return { valid: false, error: 'No file selected' };
  if (file.size > maxBytes) {
    return { valid: false, error: `File must be ${formatFileSize(maxBytes)} or smaller` };
  }
  if (file.size === 0) return { valid: false, error: 'File appears to be empty' };
  return { valid: true, error: null };
}

export function validateFileType(file, allowedMimeTypes = IMAGE_MIME_TYPES) {
  if (!file) return { valid: false, error: 'No file selected' };
  if (!allowedMimeTypes.includes(file.type)) {
    const readable = allowedMimeTypes.map((t) => t.split('/')[1].toUpperCase()).join(', ');
    return { valid: false, error: `Unsupported file type. Allowed: ${readable}` };
  }
  return { valid: true, error: null };
}

/** Runs both type and size checks. */
export function validateFile(
  file,
  { allowedMimeTypes = IMAGE_MIME_TYPES, maxBytes = DEFAULT_MAX_FILE_SIZE } = {}
) {
  const type = validateFileType(file, allowedMimeTypes);
  if (!type.valid) return type;
  return validateFileSize(file, maxBytes);
}

export const validateImage = (file, options = {}) =>
  validateFile(file, { ...options, allowedMimeTypes: IMAGE_MIME_TYPES });

/** Validates a list, returning accepted files and per-file errors. */
export function validateFiles(files, options = {}) {
  const list = Array.from(files || []);
  const accepted = [];
  const errors = [];

  for (const file of list) {
    const result = validateFile(file, options);
    if (result.valid) accepted.push(file);
    else errors.push({ file, name: file.name, error: result.error });
  }
  return { accepted, errors, valid: errors.length === 0 };
}

/** Object URL for a local preview. Revoke it when the preview unmounts. */
export const createPreviewUrl = (file) => (file ? URL.createObjectURL(file) : null);
export const revokePreviewUrl = (url) => {
  if (url) URL.revokeObjectURL(url);
};

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

/** Builds a FormData body for the upload endpoints. */
export function toFormData(files, { fieldName = 'file', extra = {} } = {}) {
  const formData = new FormData();
  const list = Array.isArray(files) || files instanceof FileList ? Array.from(files) : [files];

  list.filter(Boolean).forEach((file) => formData.append(fieldName, file));
  Object.entries(extra).forEach(([k, v]) => {
    if (v !== undefined && v !== null) formData.append(k, v);
  });

  return formData;
}

export default {
  IMAGE_MIME_TYPES,
  DOCUMENT_MIME_TYPES,
  validateFile,
  validateFiles,
  validateImage,
  validateFileSize,
  validateFileType,
  formatFileSize,
  createPreviewUrl,
  revokePreviewUrl,
  readFileAsDataUrl,
  toFormData,
};
