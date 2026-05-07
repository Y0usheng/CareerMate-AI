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

async function indexResume({ resumeId, userId, filePath, filename }) {
  const text = await extractText(filePath, filename);
  if (!text.trim()) {
    console.warn(`rag.indexResume: no extractable text for resume ${resumeId} (${filename})`);
    return { chunks: 0 };
  }
  const chunks = chunkText(text);
  if (!chunks.length) return { chunks: 0 };

  const vectors = await embedMany(chunks, 'RETRIEVAL_DOCUMENT');
  // Replace any prior chunks for this resume (re-index safe).
  deleteResumeChunks(resumeId);
  insertResumeChunks({ resumeId, userId, chunks, vectors });
  return { chunks: chunks.length };
}

async function indexJob({ jobId, title, company, description }) {
  // Prepend metadata so the embedding picks up role/company keywords even when
  // the description body doesn't repeat them.
  const header = `${title}${company ? ` at ${company}` : ''}`;
  const fullText = `${header}\n\n${description}`;
  const chunks = chunkText(fullText, { targetChars: 700, overlapChars: 100 });
  if (!chunks.length) return { chunks: 0 };
  const vectors = await embedMany(chunks, 'RETRIEVAL_DOCUMENT');
  insertJobChunks({ jobId, chunks, vectors });
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
  const resumeChunks = searchResumeChunks(userId, queryVec, config.ragTopKResume);
  const jobChunks = includeJobs ? searchJobChunks(queryVec, config.ragTopKJobs) : [];
  return { resumeChunks, jobChunks };
}

module.exports = { indexResume, indexJob, retrieve };
