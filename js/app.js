/**
 * Main application logic for the Photo to WebP Converter.
 */

import { uid, formatBytes, downloadBlob } from './utils.js';
import { convertImage, supportsWebpEncoding } from './converter.js';
import {
  renderFileList,
  renderResults,
  updateProgress,
  updateStats,
  showSection,
  hideSection,
  getSettingsFromDOM,
  setQualityDisplay,
  updateConvertButtonState,
  setFileItemStatus,
  revokeObjectUrls,
} from './ui.js';

// DOM refs.
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const selectFilesBtn = document.getElementById('select-files-btn');
const fileListWrapper = document.getElementById('file-list');
const fileItemsContainer = document.getElementById('file-items');
const clearAllBtn = document.getElementById('clear-all-btn');
const qualitySlider = document.getElementById('quality-slider');
const qualityValue = document.getElementById('quality-value');
const losslessCheck = document.getElementById('lossless-check');
const convertBtn = document.getElementById('convert-btn');
const progressSection = document.getElementById('progress-section');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const statsSection = document.getElementById('stats-section');
const totalSavingsEl = document.getElementById('total-savings');
const totalFilesEl = document.getElementById('total-files');
const resultsSection = document.getElementById('results-section');
const resultsGrid = document.getElementById('results-grid');
const downloadAllBtn = document.getElementById('download-all-btn');

// App state.
let files = [];
let results = [];
let isConverting = false;

/**
 * Add files to the app state.
 * @param {FileList} fileList
 */
function addFiles(fileList) {
  const newEntries = Array.from(fileList).map((file) => ({
    file,
    id: uid(),
    status: 'waiting',
  }));

  files = [...files, ...newEntries];
  render();
}

/**
 * Remove a single file by id.
 * @param {string} id
 */
function removeFile(id) {
  files = files.filter((entry) => entry.id !== id);
  results = results.filter((r) => r.id !== id);
  render();
}

/**
 * Clear everything.
 */
function clearAll() {
  revokeObjectUrls(fileItemsContainer);
  revokeObjectUrls(resultsGrid);
  files = [];
  results = [];
  isConverting = false;
  render();
  hideSection(progressSection);
  hideSection(statsSection);
  hideSection(resultsSection);
}

/**
 * Render file list and dependent UI state.
 */
function render() {
  renderFileList(files, fileItemsContainer, fileListWrapper, removeFile);
  updateConvertButtonState(files.length > 0 && !isConverting, convertBtn);
}

/**
 * Handle file input change.
 */
function handleFileInputChange(e) {
  if (e.target.files && e.target.files.length > 0) {
    addFiles(e.target.files);
  }
  e.target.value = '';
}

/**
 * Handle drag over.
 */
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add('drag-over');
}

/**
 * Handle drag leave.
 */
function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('drag-over');
}

/**
 * Handle drop.
 */
function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('drag-over');
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    addFiles(e.dataTransfer.files);
  }
}

/**
 * Trigger file input.
 */
function triggerFileInput() {
  fileInput.click();
}

/**
 * Handle keyboard activation of drop zone.
 */
function handleDropZoneKey(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    triggerFileInput();
  }
}

/**
 * Update quality UI when slider moves.
 */
function handleQualityInput(e) {
  const value = parseInt(e.target.value, 10);
  setQualityDisplay(value, qualityValue);
}

/**
 * Toggle lossless mode.
 */
function handleLosslessChange(e) {
  if (e.target.checked) {
    qualitySlider.value = 100;
    setQualityDisplay(100, qualityValue);
    qualitySlider.disabled = true;
  } else {
    qualitySlider.disabled = false;
  }
}

/**
 * Convert all files.
 */
async function handleConvert() {
  if (files.length === 0 || isConverting) return;

  const settings = getSettingsFromDOM();
  const webpSupported = await supportsWebpEncoding();

  if (!webpSupported) {
    alert('Dein Browser unterstützt WebP-Encoding nicht. Bitte verwende einen aktuellen Chrome, Edge oder Firefox.');
    return;
  }

  isConverting = true;
  results = [];
  updateConvertButtonState(false, convertBtn);
  hideSection(resultsSection);
  hideSection(statsSection);
  showSection(progressSection);
  updateProgress(0, files.length, progressSection, progressBar, progressText);

  files.forEach((entry) => {
    entry.status = 'waiting';
    setFileItemStatus(entry.id, 'waiting');
  });

  for (let i = 0; i < files.length; i++) {
    const entry = files[i];
    entry.status = 'converting';
    setFileItemStatus(entry.id, 'converting');

    try {
      const result = await convertImage(entry.file, settings);
      result.id = entry.id;
      result.status = 'success';
      results.push(result);
      entry.status = 'success';
      setFileItemStatus(entry.id, 'success');
    } catch (err) {
      const errorResult = {
        id: entry.id,
        file: entry.file,
        originalName: entry.file.name,
        filename: entry.file.name,
        originalSize: entry.file.size,
        webpSize: 0,
        savingsPercent: 0,
        error: err.message || 'Unbekannter Fehler',
        status: 'error',
        blob: null,
      };
      results.push(errorResult);
      entry.status = 'error';
      setFileItemStatus(entry.id, 'error');
      console.error('Conversion error:', err);
    }

    updateProgress(i + 1, files.length, progressSection, progressBar, progressText);
  }

  isConverting = false;
  updateConvertButtonState(files.length > 0, convertBtn);

  renderResults(results, resultsGrid, resultsSection, handleSingleDownload);
  updateStats(results, totalSavingsEl, totalFilesEl);
  showSection(statsSection);

  // Auto scroll to results.
  resultsSection.scrollIntoView({ behavior: 'instant', block: 'start' });
}

/**
 * Download a single result.
 * @param {Object} result
 */
function handleSingleDownload(result) {
  if (!result.blob) return;
  downloadBlob(result.blob, result.filename);
}

/**
 * Download all results as individual files or ZIP.
 */
async function handleDownloadAll() {
  const successful = results.filter((r) => r.blob && !r.error);

  if (successful.length === 0) {
    alert('Keine erfolgreich konvertierten Bilder zum Herunterladen vorhanden.');
    return;
  }

  if (successful.length === 1) {
    handleSingleDownload(successful[0]);
    return;
  }

  try {
    const zip = new JSZip();
    successful.forEach((result) => {
      zip.file(result.filename, result.blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, 'webp-convert.zip');
  } catch (err) {
    console.error('ZIP error:', err);
    alert('ZIP-Download konnte nicht erstellt werden: ' + (err.message || err));
  }
}

// Bind events.
selectFilesBtn.addEventListener('click', triggerFileInput);
dropZone.addEventListener('click', triggerFileInput);
dropZone.addEventListener('keydown', handleDropZoneKey);
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileInputChange);
clearAllBtn.addEventListener('click', clearAll);
qualitySlider.addEventListener('input', handleQualityInput);
losslessCheck.addEventListener('change', handleLosslessChange);
convertBtn.addEventListener('click', handleConvert);
downloadAllBtn.addEventListener('click', handleDownloadAll);

// Prevent dropping files on the whole document (avoids browser opening them).
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
  if (e.target !== dropZone && !dropZone.contains(e.target)) {
    e.preventDefault();
  }
});

// Initial render.
render();

// Browser support check on load.
supportsWebpEncoding().then((supported) => {
  if (!supported) {
    convertBtn.disabled = true;
    convertBtn.title = 'WebP-Encoding wird von diesem Browser nicht unterstützt.';
  }
});
