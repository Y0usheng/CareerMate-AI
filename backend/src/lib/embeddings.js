const { GoogleGenAI } = require('@google/genai');
const config = require('../config');

let _client = null;
function client() {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!_client) _client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  return _client;
}

// Float32Array <-> Buffer for SQLite BLOB storage.
function vectorToBuffer(vec) {
  const f32 = vec instanceof Float32Array ? vec : Float32Array.from(vec);
  return Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength);
}

function bufferToVector(buf) {
  // Copy into a fresh aligned ArrayBuffer; better-sqlite3 buffers may not be aligned for Float32.
  const ab = new ArrayBuffer(buf.byteLength);
  Buffer.from(ab).set(buf);
  return new Float32Array(ab);
}

async function embedOne(text, taskType = 'RETRIEVAL_DOCUMENT') {
  const res = await client().models.embedContent({
    model: config.embeddingModel,
    contents: [{ parts: [{ text }] }],
    config: { taskType },
  });
  const values = res?.embeddings?.[0]?.values;
  if (!values || !values.length) throw new Error('Empty embedding response');
  return Float32Array.from(values);
}

// Sequential to stay under per-minute quota; tiny resumes only need a handful of calls.
async function embedMany(texts, taskType = 'RETRIEVAL_DOCUMENT') {
  const out = [];
  for (const t of texts) out.push(await embedOne(t, taskType));
  return out;
}

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

module.exports = { embedOne, embedMany, cosineSim, vectorToBuffer, bufferToVector };
