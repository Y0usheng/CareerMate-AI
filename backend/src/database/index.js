const { MongoClient, GridFSBucket } = require('mongodb');
const config = require('../config');

let _client = null;
let _db = null;
let _bucket = null;

async function connect() {
  if (_db) return _db;
  if (!config.mongodbUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  _client = new MongoClient(config.mongodbUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  });
  await _client.connect();
  _db = _client.db(config.mongodbDb);
  _bucket = new GridFSBucket(_db, { bucketName: 'resumes' });

  await ensureIndexes(_db);
  return _db;
}

async function ensureIndexes(db) {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('onboarding_profiles').createIndex({ user_id: 1 }, { unique: true });
  await db.collection('resumes').createIndex({ user_id: 1, created_at: -1 });
  await db.collection('resumes').createIndex({ user_id: 1, is_active: 1 });
  await db.collection('resume_chunks').createIndex({ resume_id: 1 });
  await db.collection('resume_chunks').createIndex({ user_id: 1 });
  await db.collection('job_chunks').createIndex({ job_id: 1 });
  await db.collection('password_reset_codes').createIndex({ email: 1 });
  // Auto-purge expired reset codes via TTL — `expires_at` is a Date.
  await db.collection('password_reset_codes').createIndex(
    { expires_at: 1 },
    { expireAfterSeconds: 0 }
  );
}

function getDb() {
  if (!_db) throw new Error('MongoDB not connected — call connect() first');
  return _db;
}

function getBucket() {
  if (!_bucket) throw new Error('MongoDB not connected — call connect() first');
  return _bucket;
}

// Convenience accessors used throughout the app.
const collections = {
  users: () => getDb().collection('users'),
  onboarding: () => getDb().collection('onboarding_profiles'),
  resumes: () => getDb().collection('resumes'),
  resumeChunks: () => getDb().collection('resume_chunks'),
  jobs: () => getDb().collection('jobs'),
  jobChunks: () => getDb().collection('job_chunks'),
  passwordResetCodes: () => getDb().collection('password_reset_codes'),
  contactMessages: () => getDb().collection('contact_messages'),
};

async function close() {
  if (_client) await _client.close();
  _client = null;
  _db = null;
  _bucket = null;
}

module.exports = { connect, getDb, getBucket, collections, close };
