const express = require('express');
const multer = require('multer');
const path = require('path');
const { Readable } = require('stream');
const { ObjectId } = require('mongodb');
const { requireAuth } = require('../middleware/auth');
const { collections, getBucket } = require('../database');
const config = require('../config');
const { catchErrors } = require('../helpers');
const { InputError, NotFoundError } = require('../errors');
const { indexResume } = require('../lib/rag');

const router = express.Router();

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const MAX_SIZE_BYTES = config.maxUploadSizeMb * 1024 * 1024;

// In-memory storage — file goes straight from request body to GridFS, never
// touching the host disk (Render free tier has no persistent disk anyway).
const upload = multer({
  storage: multer.memoryStorage(),
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
    id: String(r._id),
    filename: r.filename,
    file_size: r.file_size,
    content_type: r.content_type,
    created_at: r.created_at,
  };
}

const runUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

// Stream a buffer into GridFS, returning the new file's ObjectId.
function uploadBufferToGridFS(buffer, filename, contentType) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    const stream = bucket.openUploadStream(filename, {
      contentType,
    });
    stream.on('error', reject);
    stream.on('finish', () => resolve(stream.id));
    Readable.from(buffer).pipe(stream);
  });
}

async function deleteGridFSFile(fileId) {
  if (!fileId) return;
  try {
    await getBucket().delete(fileId);
  } catch (err) {
    if (err?.code !== 'ENOENT' && !/FileNotFound/i.test(err?.message || '')) {
      console.warn('GridFS delete failed:', err.message);
    }
  }
}

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

  const userId = req.user._id;
  const resumes = collections.resumes();

  // Push file to GridFS first so we have the file_id ready for the resume row.
  const fileId = await uploadBufferToGridFS(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

  // Deactivate previous resumes so chat uses only the latest.
  await resumes.updateMany({ user_id: userId }, { $set: { is_active: false } });

  const now = new Date();
  const doc = {
    user_id: userId,
    filename: req.file.originalname,
    file_id: fileId,
    file_size: req.file.size,
    content_type: req.file.mimetype,
    is_active: true,
    created_at: now,
  };
  const insertResult = await resumes.insertOne(doc);
  const resume = { ...doc, _id: insertResult.insertedId };

  // Synchronous indexing — chat retrieval needs chunks ready next turn.
  let indexed = { chunks: 0 };
  try {
    indexed = await indexResume({
      resumeId: resume._id,
      userId,
      buffer: req.file.buffer,
      filename: resume.filename,
    });
  } catch (err) {
    console.error('resume.upload: indexing failed:', err.message);
  }

  return res.status(201).json({ ...formatResume(resume), indexed_chunks: indexed.chunks });
}));

// GET /api/resume — list all resumes for the current user
router.get('/', requireAuth, catchErrors(async (req, res) => {
  const rows = await collections
    .resumes()
    .find({ user_id: req.user._id })
    .sort({ created_at: -1 })
    .toArray();
  return res.json(rows.map(formatResume));
}));

function parseObjectIdParam(value) {
  try {
    return new ObjectId(String(value));
  } catch {
    throw new NotFoundError('Resume not found');
  }
}

// GET /api/resume/:id/download
router.get('/:id/download', requireAuth, catchErrors(async (req, res) => {
  const _id = parseObjectIdParam(req.params.id);
  const resume = await collections.resumes().findOne({ _id, user_id: req.user._id });
  if (!resume) throw new NotFoundError('Resume not found');
  if (!resume.file_id) throw new NotFoundError('File missing on server');

  res.setHeader('Content-Type', resume.content_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(resume.filename)}"`);

  const stream = getBucket().openDownloadStream(resume.file_id);
  stream.on('error', () => res.status(404).json({ detail: 'File missing on server' }));
  stream.pipe(res);
}));

// DELETE /api/resume/:id
router.delete('/:id', requireAuth, catchErrors(async (req, res) => {
  const _id = parseObjectIdParam(req.params.id);
  const resume = await collections.resumes().findOne({ _id, user_id: req.user._id });
  if (!resume) throw new NotFoundError('Resume not found');

  await deleteGridFSFile(resume.file_id);
  await collections.resumeChunks().deleteMany({ resume_id: resume._id });
  await collections.resumes().deleteOne({ _id: resume._id });

  return res.status(204).send();
}));

module.exports = router;
