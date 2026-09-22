/**
 * UI rendering helpers for the Photo to WebP Converter.
 */

import { formatBytes } from './utils.js';

const fileItemTemplate = document.getElementById('file-item-template');
const resultCardTemplate = document.getElementById('result-card-template');

/**
 * Create a DOM element for a file list item.
 * @param {File} file
 * @param {string} id
 * @param {Function} onRemove
 * @returns {HTMLElement}
 */
export function createFileItem(file, id, onRemove) {
  const clone = fileItemTemplate.content.cloneNode(true);
  const root = clone.querySelector('.file-item');
  root.dataset.id = id;

  const img = clone.querySelector('.preview-thumb');
  const url = URL.createObjectURL(file);
  img.src = url;
  img.alt = file.name;
  img.dataset.objectUrl = url;

  clone.querySelector('.file-name').textContent = file.name;
  clone.querySelector('.file-meta').textContent = `${formatBytes(file.size)} • ${file.type || 'unbekannt'}`;

  clone.querySelector('.remove-btn').addEventListener('click', () => {
    onRemove(id);
  });

  return root;
}

/**
 * Render the file list.
 * @param {Array<{file: File, id: string}>} files
 * @param {HTMLElement} listContainer
 * @param {HTMLElement} wrapper
 * @param {Function} onRemove
 */
export function renderFileList(files, listContainer, wrapper, onRemove) {
  // Revoke old preview URLs.
  listContainer.querySelectorAll('img[data-object-url]').forEach((img) => {
    URL.revokeObjectURL(img.dataset.objectUrl);
  });

  listContainer.innerHTML = '';

  if (files.length === 0) {
    wrapper.classList.add('hidden');
    return;
  }

  wrapper.classList.remove('hidden');
  files.forEach(({ file, id }) => {
    listContainer.appendChild(createFileItem(file, id, onRemove));
  });
}

/**
 * Create a DOM element for a conversion result.
 * @param {Object} result
 * @param {Function} onDownload
 * @returns {HTMLElement}
 */
export function createResultCard(result, onDownload) {
  const clone = resultCardTemplate.content.cloneNode(true);
  const root = clone.querySelector('.result-card');

  const url = URL.createObjectURL(result.blob);
  const img = clone.querySelector('.result-preview');
  img.src = url;
  img.alt = result.filename;
  img.dataset.objectUrl = url;

  clone.querySelector('.result-name').textContent = result.filename;
  clone.querySelector('.result-original-size').textContent = formatBytes(result.originalSize);
  clone.querySelector('.result-webp-size').textContent = formatBytes(result.webpSize);
  clone.querySelector('.result-savings').textContent = `${result.savingsPercent}%`;

  const statusEl = clone.querySelector('.result-status');
  statusEl.textContent = result.error ? `Fehler: ${result.error}` : 'Erfolgreich';
  statusEl.className = `result-status font-mono text-xs self-center ${result.error ? 'text-[#ff0000]' : 'text-[#00aa00]'}`;

  const downloadBtn = clone.querySelector('.download-btn');
  if (result.error || !result.blob) {
    downloadBtn.disabled = true;
    downloadBtn.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    downloadBtn.addEventListener('click', () => {
      onDownload(result);
    });
  }

  return root;
}

/**
 * Render conversion results.
 * @param {Array} results
 * @param {HTMLElement} container
 * @param {HTMLElement} wrapper
 * @param {Function} onDownload
 */
export function renderResults(results, container, wrapper, onDownload) {
  // Revoke old result preview URLs.
  container.querySelectorAll('img[data-object-url]').forEach((img) => {
    URL.revokeObjectURL(img.dataset.objectUrl);
  });

  container.innerHTML = '';

  if (results.length === 0) {
    wrapper.classList.add('hidden');
    return;
  }

  wrapper.classList.remove('hidden');
  results.forEach((result) => {
    container.appendChild(createResultCard(result, onDownload));
  });
}

/**
 * Update the overall progress bar.
 * @param {number} current
 * @param {number} total
 * @param {HTMLElement} section
 * @param {HTMLElement} bar
 * @param {HTMLElement} text
 */
export function updateProgress(current, total, section, bar, text) {
  if (total === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  const percent = Math.round((current / total) * 100);
  bar.style.width = `${percent}%`;
  text.textContent = `${current} von ${total} Bildern konvertiert`;
}

/**
 * Update hit-counter style stats.
 * @param {Array} results
 * @param {HTMLElement} savingsEl
 * @param {HTMLElement} filesEl
 */
export function updateStats(results, savingsEl, filesEl) {
  if (results.length === 0) return;

  const totalOriginal = results.reduce((sum, r) => sum + (r.originalSize || 0), 0);
  const totalWebp = results.reduce((sum, r) => sum + (r.webpSize || 0), 0);
  const savings = totalOriginal > 0 ? Math.max(0, Math.round(((totalOriginal - totalWebp) / totalOriginal) * 100)) : 0;

  savingsEl.textContent = `${savings}%`;
  filesEl.textContent = String(results.length);
}

/**
 * Show a section (remove hidden).
 * @param {HTMLElement} el
 */
export function showSection(el) {
  el.classList.remove('hidden');
}

/**
 * Hide a section.
 * @param {HTMLElement} el
 */
export function hideSection(el) {
  el.classList.add('hidden');
}

/**
 * Read settings from the DOM.
 * @returns {Object}
 */
export function getSettingsFromDOM() {
  const qualitySlider = document.getElementById('quality-slider');
  const losslessCheck = document.getElementById('lossless-check');
  const stripMetaCheck = document.getElementById('strip-meta-check');
  const maxWidthInput = document.getElementById('max-width');
  const maxHeightInput = document.getElementById('max-height');

  return {
    quality: parseInt(qualitySlider.value, 10),
    lossless: losslessCheck.checked,
    stripMetadata: stripMetaCheck.checked,
    maxWidth: maxWidthInput.value ? parseInt(maxWidthInput.value, 10) : null,
    maxHeight: maxHeightInput.value ? parseInt(maxHeightInput.value, 10) : null,
  };
}

/**
 * Update the quality display label.
 * @param {number} value
 * @param {HTMLElement} el
 */
export function setQualityDisplay(value, el) {
  el.textContent = `${value}%`;
}

/**
 * Enable/disable the convert button based on file count.
 * @param {boolean} hasFiles
 * @param {HTMLElement} btn
 */
export function updateConvertButtonState(hasFiles, btn) {
  btn.disabled = !hasFiles;
}

/**
 * Set converting status on a file item.
 * @param {string} id
 * @param {string} status waiting | converting | success | error
 */
export function setFileItemStatus(id, status) {
  const item = document.querySelector(`.file-item[data-id="${id}"]`);
  if (!item) return;

  const meta = item.querySelector('.file-meta');
  const statusLabels = {
    waiting: 'Wartend',
    converting: 'Wird konvertiert …',
    success: 'Erfolgreich',
    error: 'Fehler',
  };

  const text = statusLabels[status] || status;
  const statusEl = item.querySelector('.file-status');
  if (statusEl) {
    statusEl.textContent = text;
    statusEl.className = `file-status font-mono text-xs mt-1 ${status === 'error' ? 'text-[#ff0000]' : status === 'success' ? 'text-[#00aa00]' : 'text-[#0000ff]'}`;
  }
}

/**
 * Revoke all object URLs inside a container.
 * @param {HTMLElement} container
 */
export function revokeObjectUrls(container) {
  container.querySelectorAll('img[data-object-url]').forEach((img) => {
    URL.revokeObjectURL(img.dataset.objectUrl);
  });
}
