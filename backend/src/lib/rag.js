// RAG orchestrator: indexing (write path) + retrieval (read path).
//
// Built on LangChain components:
//   - chunkText        -> RecursiveCharacterTextSplitter   (chunker.js)
//   - getEmbeddings    -> GoogleGenerativeAIEmbeddings      (embeddings.js)
//   - make*Retriever   -> BaseRetriever over Mongo + cosine (vectorStore.js)
//
// Public API (indexResume / indexJob / retrieve) and return shapes are
// unchanged, so routes/chat.js, routes/resume.js and routes/jobs.js keep
// working as-is.

const { chunkText } = require('./chunker');
const { getEmbeddings } = require('./embeddings');
const {
  insertResumeChunks,
  deleteResumeChunks,
  insertJobChunks,
  makeResumeRetriever,
  makeJobRetriever,
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
  const chunks = await chunkText(text);
  if (!chunks.length) return { chunks: 0 };

  const vectors = await getEmbeddings('RETRIEVAL_DOCUMENT').embedDocuments(chunks);
  // Replace any prior chunks for this resume (re-index safe).
  await deleteResumeChunks(resumeId);
  await insertResumeChunks({ resumeId, userId, chunks, vectors });
  return { chunks: chunks.length };
}

async function indexJob({ jobId, title, company, description }) {
  const header = `${title}${company ? ` at ${company}` : ''}`;
  const fullText = `${header}\n\n${description}`;
  const chunks = await chunkText(fullText, { targetChars: 700, overlapChars: 100 });
  if (!chunks.length) return { chunks: 0 };

  const vectors = await getEmbeddings('RETRIEVAL_DOCUMENT').embedDocuments(chunks);
  await insertJobChunks({ jobId, chunks, vectors });
  return { chunks: chunks.length };
}

// --- Retrieval --------------------------------------------------------------

// Map a LangChain Document (from MongoCosineRetriever) back to the legacy
// chunk shape the prompt templates + chat route already expect.
function toResumeChunk(doc) {
  return {
    id: doc.metadata.id,
    score: doc.metadata.score,
    content: doc.pageContent,
    resume_id: doc.metadata.resume_id,
  };
}

function toJobChunk(doc) {
  return {
    id: doc.metadata.id,
    score: doc.metadata.score,
    content: doc.pageContent,
    job_id: doc.metadata.job_id,
    job_title: doc.metadata.job_title,
    job_company: doc.metadata.job_company,
  };
}

async function retrieve({ userId, query, includeJobs = true }) {
  // One query-task embedder shared by both retrievers. Each retriever embeds
  // the query via embedQuery — one tiny extra call vs. the old hand-rolled
  // path, traded for the clean BaseRetriever interface (reusable by the agent).
  const embeddings = getEmbeddings('RETRIEVAL_QUERY');
  try {
    const resumeRetriever = makeResumeRetriever({ userId, topK: config.ragTopKResume, embeddings });
    const resumeDocs = await resumeRetriever.invoke(query);

    let jobDocs = [];
    if (includeJobs) {
      const jobRetriever = makeJobRetriever({ topK: config.ragTopKJobs, embeddings });
      jobDocs = await jobRetriever.invoke(query);
    }

    return {
      resumeChunks: resumeDocs.map(toResumeChunk),
      jobChunks: jobDocs.map(toJobChunk),
    };
  } catch (err) {
    console.error('rag.retrieve: retrieval failed, returning empty context:', err.message);
    return { resumeChunks: [], jobChunks: [] };
  }
}

module.exports = { indexResume, indexJob, retrieve };
