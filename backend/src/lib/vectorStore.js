const db = require('../database');
const { vectorToBuffer, bufferToVector, cosineSim } = require('./embeddings');

// Insert chunked + embedded text. Caller provides parallel arrays of texts/vectors.
function insertResumeChunks({ resumeId, userId, chunks, vectors }) {
  if (chunks.length !== vectors.length) {
    throw new Error('chunks/vectors length mismatch');
  }
  const stmt = db.prepare(
    `INSERT INTO resume_chunks (resume_id, user_id, chunk_index, content, embedding, dim)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction(() => {
    for (let i = 0; i < chunks.length; i += 1) {
      stmt.run(resumeId, userId, i, chunks[i], vectorToBuffer(vectors[i]), vectors[i].length);
    }
  });
  tx();
}

function deleteResumeChunks(resumeId) {
  db.prepare('DELETE FROM resume_chunks WHERE resume_id = ?').run(resumeId);
}

function insertJobChunks({ jobId, chunks, vectors }) {
  const stmt = db.prepare(
    `INSERT INTO job_chunks (job_id, chunk_index, content, embedding, dim)
     VALUES (?, ?, ?, ?, ?)`
  );
  const tx = db.transaction(() => {
    for (let i = 0; i < chunks.length; i += 1) {
      stmt.run(jobId, i, chunks[i], vectorToBuffer(vectors[i]), vectors[i].length);
    }
  });
  tx();
}

// In-memory cosine ranking. Fine for single-user resumes (≤ ~50 chunks) and a
// modest jobs library. Swap for sqlite-vec virtual tables once corpus grows.
function searchResumeChunks(userId, queryVec, topK = 4) {
  const rows = db
    .prepare('SELECT id, resume_id, content, embedding FROM resume_chunks WHERE user_id = ?')
    .all(userId);
  return rankRows(rows, queryVec, topK);
}

function searchJobChunks(queryVec, topK = 3) {
  const rows = db
    .prepare(`SELECT jc.id, jc.job_id, jc.content, jc.embedding,
                     j.title AS job_title, j.company AS job_company
              FROM job_chunks jc
              JOIN jobs j ON j.id = jc.job_id`)
    .all();
  return rankRows(rows, queryVec, topK);
}

function rankRows(rows, queryVec, topK) {
  const scored = rows.map((r) => ({
    ...r,
    score: cosineSim(queryVec, bufferToVector(r.embedding)),
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
