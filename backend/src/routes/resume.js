const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const db = require('../database');
const config = require('../config');
const { catchErrors } = require('../helpers');
const { InputError, NotFoundError } = require('../errors');
const { indexResume } = require('../lib/rag');

const router = express.Router();

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const MAX_SIZE_BYTES = config.maxUploadSizeMb * 1024 * 1024;

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Unsupported file type. Please upload PDF, DOC, or DOCX.'));
    }
    cb(null, true);
  },
});

function formatResume(r) {
  return {
    id: r.id,
    filename: r.filename,
    file_size: r.file_size,
    content_type: r.content_type,
    created_at: r.created_at,
  };
}

/** Wraps multer's callback-style middleware in a Promise so catchErrors can handle it. */
const runUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

// POST /api/resume/upload
router.post('/upload', requireAuth, catchErrors(async (req, res) => {
  try {
    await runUpload(req, res);
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      throw new InputError(`File too large. Maximum size is ${config.maxUploadSizeMb}MB.`);
    }
    throw new InputError(err.message);
  }

  if (!req.file) throw new InputError('No file uploaded');

  const userId = req.user.id;

  // Deactivate previous resumes so chat uses only the latest
  db.prepare('UPDATE resumes SET is_active = 0 WHERE user_id = ?').run(userId);

  const result = db.prepare(
    `INSERT INTO resumes (user_id, filename, stored_filename, file_path, file_size, content_type, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  ).run(userId, req.file.originalname, req.file.filename, req.file.path, req.file.size, req.file.mimetype);

  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(result.lastInsertRowid);

  // Synchronous indexing — chat retrieval needs chunks ready on the very
  // next turn. Failure here must not break the upload itself, so we log and
  // continue (chat still has the inline-PDF fallback path).
  let indexed = { chunks: 0 };
  try {
    indexed = await indexResume({
      resumeId: resume.id,
      userId,
      filePath: resume.file_path,
      filename: resume.filename,
    });
  } catch (err) {
    console.error('resume.upload: indexing failed:', err.message);
  }

  return res.status(201).json({ ...formatResume(resume), indexed_chunks: indexed.chunks });
}));

// GET /api/resume — list all resumes for the current user
router.get('/', requireAuth, catchErrors(async (req, res) => {
  const resumes = db
    .prepare('SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  return res.json(resumes.map(formatResume));
}));

// GET /api/resume/:id/download
router.get('/:id/download', requireAuth, catchErrors(async (req, res) => {
  const resume = db
    .prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?')
    .get(Number(req.params.id), req.user.id);

  if (!resume) throw new NotFoundError('Resume not found');
  if (!fs.existsSync(resume.file_path)) throw new NotFoundError('File missing on server');

  res.download(resume.file_path, resume.filename);
}));

// DELETE /api/resume/:id
router.delete('/:id', requireAuth, catchErrors(async (req, res) => {
  const resume = db
    .prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?')
    .get(Number(req.params.id), req.user.id);

  if (!resume) throw new NotFoundError('Resume not found');

  try {
    if (fs.existsSync(resume.file_path)) fs.unlinkSync(resume.file_path);
  } catch {
    // File removal failure is non-fatal
  }

  db.prepare('DELETE FROM resumes WHERE id = ?').run(resume.id);
  return res.status(204).send();
}));

module.exports = router;
