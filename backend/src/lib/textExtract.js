const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// pdf-parse loaded lazily because it executes filesystem-touching code at
// require time when bundled in some setups.
async function extractFromPdf(filePath) {
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  const out = await pdfParse(buffer);
  return out.text || '';
}

async function extractFromDocx(filePath) {
  const { value } = await mammoth.extractRawText({ path: filePath });
  return value || '';
}

// Best-effort text extraction. Returns '' for unsupported formats / failures
// so the caller can degrade gracefully (chat still works via inline PDF).
async function extractText(filePath, filename) {
  if (!filePath || !fs.existsSync(filePath)) return '';
  const ext = path.extname(filename || filePath).toLowerCase();
  try {
    if (ext === '.pdf') return await extractFromPdf(filePath);
    if (ext === '.docx') return await extractFromDocx(filePath);
    return '';
  } catch (err) {
    console.error(`textExtract: failed for ${filename}: ${err.message}`);
    return '';
  }
}

module.exports = { extractText };
