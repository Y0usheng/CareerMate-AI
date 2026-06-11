// Vector store backed by MongoDB.
//
// Write path: plain inserts of chunk + embedding (stored as a JSON number[]).
// Read path: exposed as LangChain `BaseRetriever`s so the RAG orchestrator and
// the LangGraph agent both consume the standard retriever interface
// (`retriever.invoke(query) -> Document[]`).
//
// Why a custom retriever instead of LangChain's MongoDBAtlasVectorSearch:
// Atlas M0 has no Vector Search, so we load the candidate chunks for the
// user/library and rank by cosine similarity in JS. Fine for the working set;
// swap to Atlas Vector Search when the corpus grows past ~10k chunks.

const { BaseRetriever } = require('@langchain/core/retrievers');
const { Document } = require('@langchain/core/documents');
const { collections } = require('../database');
const { cosineSim } = require('./embeddings');

// --- Write path -------------------------------------------------------------

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

// --- Read path: a LangChain retriever over Mongo + JS cosine ----------------

class MongoCosineRetriever extends BaseRetriever {
  constructor(fields) {
    super(fields);
    this.lc_namespace = ['careermate', 'retrievers', 'mongo_cosine'];
    this.embeddings = fields.embeddings; // a query-task Embeddings instance
    this.loadRows = fields.loadRows; // async () => [{ _id, content, embedding, ...meta }]
    this.topK = fields.topK ?? 4;
    this.toMetadata = fields.toMetadata || (() => ({}));
  }

  async _getRelevantDocuments(query) {
    const queryVec = await this.embeddings.embedQuery(query);
    const rows = await this.loadRows();
    return rows
      .map((row) => ({ row, score: cosineSim(queryVec, row.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, this.topK)
      .map(
        ({ row, score }) =>
          new Document({
            pageContent: row.content,
            metadata: { id: String(row._id), score, ...this.toMetadata(row) },
          })
      );
  }
}

function makeResumeRetriever({ userId, topK, embeddings }) {
  return new MongoCosineRetriever({
    embeddings,
    topK,
    loadRows: () =>
      collections
        .resumeChunks()
        .find({ user_id: userId }, { projection: { content: 1, embedding: 1, resume_id: 1 } })
        .toArray(),
    toMetadata: (r) => ({ resume_id: r.resume_id }),
  });
}

function makeJobRetriever({ topK, embeddings }) {
  return new MongoCosineRetriever({
    embeddings,
    topK,
    loadRows: () =>
      collections
        .jobChunks()
        .aggregate([
          { $lookup: { from: 'jobs', localField: 'job_id', foreignField: '_id', as: 'job' } },
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
        .toArray(),
    toMetadata: (r) => ({ job_id: r.job_id, job_title: r.job_title, job_company: r.job_company }),
  });
}

module.exports = {
  insertResumeChunks,
  deleteResumeChunks,
  insertJobChunks,
  makeResumeRetriever,
  makeJobRetriever,
  MongoCosineRetriever,
};
