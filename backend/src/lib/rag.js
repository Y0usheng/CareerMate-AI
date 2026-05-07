// RAG orchestrator: indexing (write path) + retrieval (read path).

const { chunkText } = require('./chunker');
const { embedMany, embedOne } = require('./embeddings');
const {
  insertResumeChunks,
  deleteResumeChunks,
  insertJobChunks,
  searchResumeChunks,
  searchJobChunks,
} = require('./vectorStore');
const { extractText } = require('./textExtract');
const config = require('../config');

// --- Indexing ---------------------------------------------------------------

async function indexResume({ resumeId, userId, buffer, filename }) {
  const text = await extractText(buffer, filename);
  if (!text.trim()) {
    console.warn(`rag.indexResume: no extractable text for resume ${resumeId} (${filename})`);
    return { chunks: 0 };
  }
  const chunks = chunkText(text);
  if (!chunks.length) return { chunks: 0 };

  const vectors = await embedMany(chunks, 'RETRIEVAL_DOCUMENT');
  // Replace any prior chunks for this resume (re-index safe).
  await deleteResumeChunks(resumeId);
  await insertResumeChunks({ resumeId, userId, chunks, vectors });
  return { chunks: chunks.length };
}

async function indexJob({ jobId, title, company, description }) {
  const header = `${title}${company ? ` at ${company}` : ''}`;
  const fullText = `${header}\n\n${description}`;
  const chunks = chunkText(fullText, { targetChars: 700, overlapChars: 100 });
  if (!chunks.length) return { chunks: 0 };
  const vectors = await embedMany(chunks, 'RETRIEVAL_DOCUMENT');
  await insertJobChunks({ jobId, chunks, vectors });
  return { chunks: chunks.length };
}

// --- Retrieval --------------------------------------------------------------

async function retrieve({ userId, query, includeJobs = true }) {
  let queryVec;
  try {
    queryVec = await embedOne(query, 'RETRIEVAL_QUERY');
  } catch (err) {
    console.error('rag.retrieve: embedding failed, returning empty context:', err.message);
    return { resumeChunks: [], jobChunks: [] };
  }
  const resumeChunks = await searchResumeChunks(userId, queryVec, config.ragTopKResume);
  const jobChunks = includeJobs ? await searchJobChunks(queryVec, config.ragTopKJobs) : [];
  return { resumeChunks, jobChunks };
}

module.exports = { indexResume, indexJob, retrieve };
