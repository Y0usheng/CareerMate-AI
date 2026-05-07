const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const db = require('../database');
const { catchErrors, validate } = require('../helpers');
const { NotFoundError } = require('../errors');
const { indexJob } = require('../lib/rag');

const router = express.Router();

function formatJob(j) {
  return {
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    description: j.description,
    source: j.source,
    created_at: j.created_at,
  };
}

// POST /api/jobs — add a JD to the library and index it.
router.post(
  '/',
  requireAuth,
  [
    body('title').trim().notEmpty().withMessage('title is required'),
    body('description').trim().notEmpty().withMessage('description is required'),
  ],
  catchErrors(async (req, res) => {
    validate(req);
    const { title, company = null, location = null, description, source = null } = req.body;

    const result = db
      .prepare(`INSERT INTO jobs (title, company, location, description, source)
                VALUES (?, ?, ?, ?, ?)`)
      .run(title, company, location, description, source);

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);

    let indexed = { chunks: 0 };
    try {
      indexed = await indexJob({ jobId: job.id, title: job.title, company: job.company, description: job.description });
    } catch (err) {
      console.error('jobs.create: indexing failed:', err.message);
    }

    return res.status(201).json({ ...formatJob(job), indexed_chunks: indexed.chunks });
  })
);

// GET /api/jobs
router.get('/', requireAuth, catchErrors(async (_req, res) => {
  const rows = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all();
  return res.json(rows.map(formatJob));
}));

// GET /api/jobs/:id
router.get('/:id', requireAuth, catchErrors(async (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(Number(req.params.id));
  if (!job) throw new NotFoundError('Job not found');
  return res.json(formatJob(job));
}));

// DELETE /api/jobs/:id — chunks cascade via FK.
router.delete('/:id', requireAuth, catchErrors(async (req, res) => {
  const result = db.prepare('DELETE FROM jobs WHERE id = ?').run(Number(req.params.id));
  if (result.changes === 0) throw new NotFoundError('Job not found');
  return res.status(204).send();
}));

module.exports = router;
