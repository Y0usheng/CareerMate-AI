// Gemini embeddings via LangChain's GoogleGenerativeAIEmbeddings adapter.
//
// We expose `getEmbeddings(taskType)` so the rest of the RAG stack speaks the
// LangChain `Embeddings` interface (`embedDocuments` / `embedQuery`). The
// adapter talks to the same `text-embedding-004` model the project used
// before, so vectors already stored in Mongo stay in the same space — no
// re-indexing needed when switching to LangChain.
//
// taskType is passed as the literal string Gemini expects (RETRIEVAL_DOCUMENT
// for indexing, RETRIEVAL_QUERY for lookups). It maps 1:1 to the TaskType enum
// in @google/generative-ai, so we avoid taking a direct dep on that package.

const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const config = require('../config');

// One adapter instance per taskType — they're cheap but stateless, so cache.
const _byTask = new Map();

function getEmbeddings(taskType = 'RETRIEVAL_DOCUMENT') {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!_byTask.has(taskType)) {
    _byTask.set(
      taskType,
      new GoogleGenerativeAIEmbeddings({
        apiKey: config.geminiApiKey,
        model: config.embeddingModel,
        taskType,
        // Keep raw text (matches how existing chunks were embedded); the
        // default `true` would strip newlines and subtly shift vectors.
        stripNewLines: false,
      })
    );
  }
  return _byTask.get(taskType);
}

// Cosine similarity over plain number[] (or Float32Array). Still hand-rolled
// because Atlas M0 has no Vector Search — we rank candidate chunks in JS.
function cosineSim(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

module.exports = { getEmbeddings, cosineSim };
