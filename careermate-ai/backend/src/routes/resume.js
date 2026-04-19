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

  db.prepare('UPDATE resumes SET is_active = 0 WHERE user_id = ?').run(userId);

  const result = db.prepare(
    `INSERT INTO resumes (user_id, filename, stored_filename, file_path, file_size, content_type)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userId, req.file.originalname, req.file.filename, req.file.path, req.file.size, req.file.mimetype);

  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(formatResume(resume));
}));

// GET /api/resume
router.get('/', requireAuth, catchErrors(async (req, res) => {
  const resume = db
    .prepare('SELECT * FROM resumes WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1')
    .get(req.user.id);

  if (!resume) throw new NotFoundError('No active resume found');
  return res.json(formatResume(resume));
}));

// DELETE /api/resume
router.delete('/', requireAuth, catchErrors(async (req, res) => {
  const resume = db
    .prepare('SELECT * FROM resumes WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1')
    .get(req.user.id);

  if (!resume) throw new NotFoundError('No active resume found');

  try {
    if (fs.existsSync(resume.file_path)) fs.unlinkSync(resume.file_path);
  } catch {
    // File removal failure is non-fatal
  }

  db.prepare('DELETE FROM resumes WHERE id = ?').run(resume.id);
  return res.status(204).send();
}));

module.exports = router;
