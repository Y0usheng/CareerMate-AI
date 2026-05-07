const { collections } = require('../database');
const { cosineSim } = require('./embeddings');

// Insert chunked + embedded text. Embeddings are stored as plain JSON arrays
// in Mongo — Atlas M0 doesn't support Vector Search, so we read all chunks
// for the user/library and rank in JS. Fine for the working set; swap to
// Atlas Vector Search ($DENSE) when corpus grows past ~10k chunks.
async function insertResumeChunks({ resumeId, userId, chunks, vectors }) {
  if (chunks.length !== vectors.length) {
    throw new Error('chunks/vectors length mismatch');
  }
  if (chunks.length === 0) return;
  const docs = chunks.map((content, i) => ({
    resume_id: resumeId,
    user_id: userId,
    chunk_index: i,
    content,
    embedding: Array.from(vectors[i]),
    dim: vectors[i].length,
    created_at: new Date(),
  }));
  await collections.resumeChunks().insertMany(docs);
}

async function deleteResumeChunks(resumeId) {
  await collections.resumeChunks().deleteMany({ resume_id: resumeId });
}

async function insertJobChunks({ jobId, chunks, vectors }) {
  if (chunks.length === 0) return;
  const docs = chunks.map((content, i) => ({
    job_id: jobId,
    chunk_index: i,
    content,
    embedding: Array.from(vectors[i]),
    dim: vectors[i].length,
    created_at: new Date(),
  }));
  await collections.jobChunks().insertMany(docs);
}

async function searchResumeChunks(userId, queryVec, topK = 4) {
  const rows = await collections
    .resumeChunks()
    .find({ user_id: userId }, { projection: { content: 1, embedding: 1, resume_id: 1 } })
    .toArray();
  return rankRows(
    rows.map((r) => ({ id: String(r._id), resume_id: r.resume_id, content: r.content, embedding: r.embedding })),
    queryVec,
    topK
  );
}

async function searchJobChunks(queryVec, topK = 3) {
  const rows = await collections
    .jobChunks()
    .aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: 'job_id',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: '$job' },
      {
        $project: {
          content: 1,
          embedding: 1,
          job_id: 1,
          job_title: '$job.title',
          job_company: '$job.company',
        },
      },
    ])
    .toArray();
  return rankRows(
    rows.map((r) => ({
      id: String(r._id),
      job_id: r.job_id,
      content: r.content,
      embedding: r.embedding,
      job_title: r.job_title,
      job_company: r.job_company,
    })),
    queryVec,
    topK
  );
}

function rankRows(rows, queryVec, topK) {
  const scored = rows.map((r) => ({
    ...r,
    score: cosineSim(queryVec, r.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

module.exports = {
  insertResumeChunks,
  deleteResumeChunks,
  insertJobChunks,
  searchResumeChunks,
  searchJobChunks,
};
