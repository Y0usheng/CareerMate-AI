// Loads a user's active resume into a neutral, SDK-agnostic representation so
// both the chat route (native @google/genai parts) and the LangGraph agent
// (LangChain content blocks) can attach the full document when needed.

const path = require('path');
const mammoth = require('mammoth');
const { collections, getBucket } = require('../database');

// Drains a GridFS read stream into a Buffer.
function readGridFSFile(fileId) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = getBucket().openDownloadStream(fileId);
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/**
 * Returns the user's active resume in a neutral shape, or null:
 *   { kind: 'pdf',  mimeType, dataBase64, filename }   // inline the real PDF
 *   { kind: 'text', text, filename }                   // DOCX → extracted text
 *
 * PDFs are kept as the raw document (Gemini reads layout/headings, and OCRs
 * scanned files); only DOCX is flattened to text.
 */
async function loadActiveResume(userId) {
  const resume = await collections
    .resumes()
    .findOne({ user_id: userId, is_active: true }, { sort: { created_at: -1 } });

  if (!resume || !resume.file_id) return null;

  const ext = path.extname(resume.filename || '').toLowerCase();
  try {
    const buffer = await readGridFSFile(resume.file_id);
    if (ext === '.pdf') {
      return {
        kind: 'pdf',
        mimeType: 'application/pdf',
        dataBase64: buffer.toString('base64'),
        filename: resume.filename,
      };
    }
    if (ext === '.docx') {
      const { value } = await mammoth.extractRawText({ buffer });
      const text = (value || '').trim();
      if (!text) return null;
      return { kind: 'text', text, filename: resume.filename };
    }
    return null;
  } catch (err) {
    console.error('Failed to load resume:', err.message);
    return null;
  }
}

// Convenience: the wrapped-text form used when a resume is flattened to text.
function resumeTextBlock(filename, text) {
  return `Attached resume file: ${filename}\n\n--- RESUME CONTENT ---\n${text}\n--- END RESUME ---`;
}

module.exports = { loadActiveResume, readGridFSFile, resumeTextBlock };
