const express = require('express');
const { body } = require('express-validator');
const { GoogleGenAI } = require('@google/genai');
const { requireAuth } = require('../middleware/auth');
const config = require('../config');
const { catchErrors, validate } = require('../helpers');
const { InputError } = require('../errors');
const { classifyIntent } = require('../lib/intentRouter');
const { buildPrompt } = require('../lib/promptTemplates');
const { retrieve } = require('../lib/rag');
const { loadActiveResume, resumeTextBlock } = require('../lib/resumeContext');

const router = express.Router();

/**
 * Returns a native @google/genai `part` for the user's active resume, or null.
 * We still inline the full PDF (or DOCX text) on every turn so the model has
 * the untruncated document — RAG narrows attention via the system prompt, the
 * inline part is the safety net.
 */
async function buildResumePart(userId) {
  const resume = await loadActiveResume(userId);
  if (!resume) return null;
  if (resume.kind === 'pdf') {
    return { inlineData: { mimeType: resume.mimeType, data: resume.dataBase64 } };
  }
  return { text: resumeTextBlock(resume.filename, resume.text) };
}

async function generateWithFallback(ai, contents, systemInstruction) {
  const modelsToTry = [
    config.geminiModel,
    'gemini-2.0-flash',
    'gemini-flash-latest',
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let lastErr;
  outer: for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await ai.models.generateContent({
          model,
          contents,
          config: { systemInstruction },
        });
      } catch (err) {
        lastErr = err;
        const status = err?.status || err?.response?.status;
        const msg = err?.message || '';
        const overloaded = status === 503 || status === 429 || /UNAVAILABLE|overloaded|high demand/i.test(msg);
        if (!overloaded) break outer;
        if (attempt < 2) await sleep(600 * (attempt + 1));
      }
    }
  }
  throw lastErr || new Error('Generation failed');
}

// POST /api/chat
router.post(
  '/',
  requireAuth,
  [body('message').trim().notEmpty().withMessage('Message is required')],
  catchErrors(async (req, res) => {
    validate(req);

    if (!config.geminiApiKey) {
      throw new InputError('AI service is not configured. Please set GEMINI_API_KEY.');
    }

    const { message, history = [] } = req.body;
    const user = req.user;

    const intent = await classifyIntent(message);
    const includeJobs = intent === 'job_match' || intent === 'interview_prep' || intent === 'career_planning';
    const { resumeChunks, jobChunks } = await retrieve({
      userId: user._id,
      query: message,
      includeJobs,
    });

    const systemInstruction = buildPrompt(intent, { user, resumeChunks, jobChunks });

    const contents = [];
    for (const entry of history) {
      const role = entry.role === 'assistant' ? 'model' : entry.role === 'user' ? 'user' : null;
      if (!role) continue;
      const text = entry.text || entry.content || '';
      contents.push({ role, parts: [{ text }] });
    }
    const resumePart = await buildResumePart(user._id);
    const latestParts = [];
    if (resumePart) latestParts.push(resumePart);
    latestParts.push({ text: message });
    contents.push({ role: 'user', parts: latestParts });

    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    let response;
    try {
      response = await generateWithFallback(ai, contents, systemInstruction);
    } catch {
      throw new InputError('Gemini is overloaded right now. Please try again in a moment.');
    }

    return res.json({
      reply: response.text || '',
      intent,
      retrieval: {
        resume_chunks: resumeChunks.map((c) => ({ id: c.id, score: Number(c.score.toFixed(4)) })),
        job_chunks: jobChunks.map((c) => ({ id: c.id, job_id: String(c.job_id), title: c.job_title, score: Number(c.score.toFixed(4)) })),
      },
    });
  })
);

module.exports = router;
