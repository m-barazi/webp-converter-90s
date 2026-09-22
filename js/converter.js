/**
 * Image conversion engine for the Photo to WebP Converter.
 * All operations run locally in the browser.
 */

import {
  detectFormat,
  generateWebpFilename,
  readFileAsArrayBuffer,
  readFileAsText,
  calculateSavings,
} from './utils.js';

const MAX_CANVAS_DIMENSION = 16384; // Conservative browser limit.

/**
 * Load an image from a Blob/File/ObjectURL.
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht decodiert werden.'));
    img.src = src;
  });
}

/**
 * Decode a file to an HTMLCanvasElement.
 * @param {File} file
 * @param {string} format
 * @returns {Promise<HTMLCanvasElement>}
 */
async function decodeToCanvas(file, format) {
  let url = null;

  try {
    if (format === 'heic' || format === 'heif') {
      return await decodeHeic(file);
    }

    if (format === 'tiff' || format === 'tif') {
      return await decodeTiff(file);
    }

    if (format === 'svg') {
      return await decodeSvg(file);
    }

    // Native browser decoding: jpeg, png, gif, bmp, avif, webp.
    url = URL.createObjectURL(file);
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}

/**
 * Decode HEIC/HEIF using heic2any.
 * @param {File} file
 * @returns {Promise<HTMLCanvasElement>}
 */
async function decodeHeic(file) {
  if (typeof heic2any === 'undefined') {
    throw new Error('HEIC/HEIF-Decoder ist noch nicht geladen. Bitte versuche es erneut.');
  }

  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/png',
      quality: 1,
    });

    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    const url = URL.createObjectURL(blob);
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    return canvas;
  } catch (err) {
    throw new Error('HEIC/HEIF konnte nicht decodiert werden: ' + (err.message || err));
  }
}

/**
 * Decode TIFF/TIF using UTIF.js.
 * @param {File} file
 * @returns {Promise<HTMLCanvasElement>}
 */
async function decodeTiff(file) {
  if (typeof UTIF === 'undefined') {
    throw new Error('TIFF-Decoder ist noch nicht geladen. Bitte versuche es erneut.');
  }

  try {
    const buffer = await readFileAsArrayBuffer(file);
    const ifds = UTIF.decode(buffer);

    if (!ifds || ifds.length === 0) {
      throw new Error('TIFF-Datei enthält keine Bilddaten.');
    }

    // Decode first page/image.
    UTIF.decodeImage(buffer, ifds[0]);
    const rgba = UTIF.toRGBA8(ifds[0]);

    const canvas = document.createElement('canvas');
    canvas.width = ifds[0].width;
    canvas.height = ifds[0].height;
    const ctx = canvas.getContext('2d');
    const imageData = new ImageData(new Uint8ClampedArray(rgba), ifds[0].width, ifds[0].height);
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  } catch (err) {
    throw new Error('TIFF konnte nicht decodiert werden: ' + (err.message || err));
  }
}

/**
 * Decode SVG to a canvas.
 * @param {File} file
 * @returns {Promise<HTMLCanvasElement>}
 */
async function decodeSvg(file) {
  const svgText = await readFileAsText(file);
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');

  if (!svgEl) {
    throw new Error('SVG-Datei enthält kein gültiges SVG-Element.');
  }

  // Determine dimensions.
  let width = parseFloat(svgEl.getAttribute('width')) || 0;
  let height = parseFloat(svgEl.getAttribute('height')) || 0;

  if ((!width || !height) && svgEl.getAttribute('viewBox')) {
    const parts = svgEl.getAttribute('viewBox').split(/[\s,]+/);
    if (parts.length === 4) {
      const vbW = parseFloat(parts[2]);
      const vbH = parseFloat(parts[3]);
      if (vbW && vbH) {
        width = width || vbW;
        height = height || vbH;
      }
    }
  }

  // Fallback to a reasonable size if still missing.
  width = width || 512;
  height = height || 512;

  // Ensure XML declaration and explicit dimensions for canvas drawing.
  svgEl.setAttribute('width', width);
  svgEl.setAttribute('height', height);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgEl);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Resize a canvas while preserving aspect ratio.
 * @param {HTMLCanvasElement} sourceCanvas
 * @param {number|null} maxWidth
 * @param {number|null} maxHeight
 * @returns {HTMLCanvasElement}
 */
function resizeCanvas(sourceCanvas, maxWidth, maxHeight) {
  let { width, height } = sourceCanvas;

  const targetMaxWidth = maxWidth ? parseInt(maxWidth, 10) : null;
  const targetMaxHeight = maxHeight ? parseInt(maxHeight, 10) : null;

  if (targetMaxWidth && width > targetMaxWidth) {
    const ratio = targetMaxWidth / width;
    width = targetMaxWidth;
    height = Math.round(height * ratio);
  }

  if (targetMaxHeight && height > targetMaxHeight) {
    const ratio = targetMaxHeight / height;
    height = targetMaxHeight;
    width = Math.round(width * ratio);
  }

  // Also clamp to browser canvas limits.
  if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION) {
    const ratio = Math.min(MAX_CANVAS_DIMENSION / width, MAX_CANVAS_DIMENSION / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }

  if (width === sourceCanvas.width && height === sourceCanvas.height) {
    return sourceCanvas;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0, width, height);
  return canvas;
}

/**
 * Encode a canvas to WebP Blob.
 * @param {HTMLCanvasElement} canvas
 * @param {number} quality 0-1
 * @returns {Promise<Blob>}
 */
function encodeWebp(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('WebP-Export wird von diesem Browser nicht unterstützt.'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Convert a single image file to WebP.
 * @param {File} file
 * @param {Object} options
 * @param {number} options.quality - 1 to 100
 * @param {boolean} options.lossless
 * @param {number|null} options.maxWidth
 * @param {number|null} options.maxHeight
 * @param {boolean} options.stripMetadata
 * @returns {Promise<Object>}
 */
export async function convertImage(file, options = {}) {
  const format = detectFormat(file);

  if (!format) {
    throw new Error(`Dateiformat nicht erkannt oder nicht unterstützt: "${file.name}"`);
  }

  if (!['jpeg', 'jpg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'heic', 'heif', 'avif', 'svg', 'webp'].includes(format)) {
    throw new Error(`Format "${format.toUpperCase()}" wird nicht unterstützt.`);
  }

  const quality = options.lossless ? 1.0 : Math.max(0.01, Math.min(1, options.quality / 100));

  const sourceCanvas = await decodeToCanvas(file, format);
  const finalCanvas = resizeCanvas(sourceCanvas, options.maxWidth, options.maxHeight);

  const webpBlob = await encodeWebp(finalCanvas, quality);
  const webpSize = webpBlob.size;
  const originalSize = file.size;

  return {
    blob: webpBlob,
    filename: generateWebpFilename(file.name),
    originalName: file.name,
    format,
    originalSize,
    webpSize,
    savingsPercent: calculateSavings(originalSize, webpSize),
  };
}

/**
 * Check if the browser supports WebP encoding.
 * @returns {Promise<boolean>}
 */
export function supportsWebpEncoding() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob !== null && blob.type === 'image/webp');
    }, 'image/webp');
  });
}

/**
 * Pre-check for HEIC support (heic2any loaded).
 * @returns {boolean}
 */
export function heicSupported() {
  return typeof heic2any !== 'undefined';
}

/**
 * Pre-check for TIFF support (UTIF loaded).
 * @returns {boolean}
 */
export function tiffSupported() {
  return typeof UTIF !== 'undefined';
}
