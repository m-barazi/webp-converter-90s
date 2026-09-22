/**
 * Utilities for the Photo to WebP Converter.
 */

/**
 * Format bytes to human readable string.
 * @param {number} bytes
 * @param {number} decimals
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Get lower-case extension without dot.
 * @param {string} filename
 * @returns {string}
 */
export function getFileExtension(filename) {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts.pop().toLowerCase();
}

/**
 * Supported input formats.
 */
export const SUPPORTED_FORMATS = [
  'jpeg', 'jpg', 'png', 'gif', 'bmp', 'tiff', 'tif',
  'heic', 'heif', 'avif', 'svg', 'webp'
];

/**
 * Detect canonical format key from file.
 * @param {File} file
 * @returns {string|null}
 */
export function detectFormat(file) {
  const ext = getFileExtension(file.name);
  const mime = file.type.toLowerCase();

  // Trust explicit MIME type first for formats the browser can identify.
  const mimeMap = {
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpeg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/x-ms-bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/tif': 'tiff',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
  };

  if (mimeMap[mime]) {
    return mimeMap[mime];
  }

  // Fallback to extension.
  const extMap = {
    'jpg': 'jpeg',
    'jpeg': 'jpeg',
    'png': 'png',
    'gif': 'gif',
    'bmp': 'bmp',
    'tiff': 'tiff',
    'tif': 'tiff',
    'heic': 'heic',
    'heif': 'heif',
    'avif': 'avif',
    'svg': 'svg',
    'webp': 'webp',
  };

  return extMap[ext] || null;
}

/**
 * Generate WebP filename from original.
 * @param {string} originalName
 * @returns {string}
 */
export function generateWebpFilename(originalName) {
  const base = originalName.replace(/\.[^.]+$/i, '');
  return base + '.webp';
}

/**
 * Download a Blob with the given filename.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  if (typeof saveAs !== 'undefined') {
    saveAs(blob, filename);
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Read a File as an ArrayBuffer.
 * @param {File} file
 * @returns {Promise<ArrayBuffer>}
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read a File as text.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Calculate savings percentage.
 * @param {number} originalSize
 * @param {number} newSize
 * @returns {number}
 */
export function calculateSavings(originalSize, newSize) {
  if (originalSize === 0) return 0;
  const savings = ((originalSize - newSize) / originalSize) * 100;
  return Math.max(0, Math.round(savings));
}

/**
 * Create a unique ID.
 * @returns {string}
 */
export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
