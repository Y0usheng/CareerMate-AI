const express = require('express');
const { body } = require('express-validator');
const { ObjectId } = require('mongodb');
const { requireAuth } = require('../middleware/auth');
const { collections } = require('../database');
const { catchErrors, validate } = require('../helpers');
const { NotFoundError } = require('../errors');
const { indexJob } = require('../lib/rag');

const router = express.Router();

function formatJob(j) {
  return {
    id: String(j._id),
    title: j.title,
    company: j.company,
    location: j.location,
    description: j.description,
    source: j.source,
    created_at: j.created_at,
  };
}

function parseObjectIdParam(value) {
  try {
    return new ObjectId(String(value));
  } catch {
    throw new NotFoundError('Job not found');
  }
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

    const jobs = collections.jobs();
    const doc = {
      title,
      company,
      location,
      description,
      source,
      created_at: new Date(),
    };
    const insertResult = await jobs.insertOne(doc);
    const job = { ...doc, _id: insertResult.insertedId };

    let indexed = { chunks: 0 };
    try {
      indexed = await indexJob({
        jobId: job._id,
        title: job.title,
        company: job.company,
        description: job.description,
      });
    } catch (err) {
      console.error('jobs.create: indexing failed:', err.message);
    }

    return res.status(201).json({ ...formatJob(job), indexed_chunks: indexed.chunks });
  })
);

// GET /api/jobs
router.get('/', requireAuth, catchErrors(async (_req, res) => {
  const rows = await collections.jobs().find({}).sort({ created_at: -1 }).toArray();
  return res.json(rows.map(formatJob));
}));

// GET /api/jobs/:id
router.get('/:id', requireAuth, catchErrors(async (req, res) => {
  const _id = parseObjectIdParam(req.params.id);
  const job = await collections.jobs().findOne({ _id });
  if (!job) throw new NotFoundError('Job not found');
  return res.json(formatJob(job));
}));

// DELETE /api/jobs/:id — also clear its chunks.
router.delete('/:id', requireAuth, catchErrors(async (req, res) => {
  const _id = parseObjectIdParam(req.params.id);
  const result = await collections.jobs().deleteOne({ _id });
  if (result.deletedCount === 0) throw new NotFoundError('Job not found');
  await collections.jobChunks().deleteMany({ job_id: _id });
  return res.status(204).send();
}));

module.exports = router;
