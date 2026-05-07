const path = require('path');
const mammoth = require('mammoth');

async function extractFromPdf(buffer) {
  const pdfParse = require('pdf-parse');
  const out = await pdfParse(buffer);
  return out.text || '';
}

async function extractFromDocx(buffer) {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || '';
}

// Best-effort text extraction from a Buffer. Returns '' for unsupported
// formats / failures so the caller can degrade gracefully.
async function extractText(buffer, filename) {
  if (!buffer || !buffer.length) return '';
  const ext = path.extname(filename || '').toLowerCase();
  try {
    if (ext === '.pdf') return await extractFromPdf(buffer);
    if (ext === '.docx') return await extractFromDocx(buffer);
    return '';
  } catch (err) {
    console.error(`textExtract: failed for ${filename}: ${err.message}`);
    return '';
  }
}

module.exports = { extractText };
