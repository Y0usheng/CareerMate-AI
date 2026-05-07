const express = require('express');
const fs = require('fs');
const path = require('path');
const { body } = require('express-validator');
const { GoogleGenAI } = require('@google/genai');
const mammoth = require('mammoth');
const { requireAuth } = require('../middleware/auth');
const db = require('../database');
const config = require('../config');
const { catchErrors, validate } = require('../helpers');
const { InputError } = require('../errors');
const { classifyIntent } = require('../lib/intentRouter');
const { buildPrompt } = require('../lib/promptTemplates');
const { retrieve } = require('../lib/rag');

const router = express.Router();

/**
 * Returns a Gemini `part` representing the user's active resume, or null.
 *
 * We still inline the full PDF (or DOCX text) on every turn so the model has
 * access to layout and any chunks RAG missed — RAG narrows attention via the
 * system prompt, the inline part is the safety net.
 */
async function buildResumePart(userId) {
  const resume = db
    .prepare('SELECT filename, file_path, content_type FROM resumes WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1')
    .get(userId);

  if (!resume || !resume.file_path || !fs.existsSync(resume.file_path)) return null;

  const ext = path.extname(resume.filename || resume.file_path).toLowerCase();

  try {
    if (ext === '.pdf') {
      const buffer = fs.readFileSync(resume.file_path);
      return {
        inlineData: {
          mimeType: 'application/pdf',
          data: buffer.toString('base64'),
        },
      };
    }
    if (ext === '.docx') {
      const { value } = await mammoth.extractRawText({ path: resume.file_path });
      const text = (value || '').trim();
      if (!text) return null;
      return {
        text: `Attached resume file: ${resume.filename}\n\n--- RESUME CONTENT ---\n${text}\n--- END RESUME ---`,
      };
    }
    return null;
  } catch (err) {
    console.error('Failed to load resume for chat:', err.message);
    return null;
  }
}

async function generateWithFallback(ai, contents, systemInstruction) {
  const modelsToTry = [
    config.geminiModel,
    'gemini-2.0-flash',
    'gemini-flash-latest',
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let response;
  let lastErr;
  outer: for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await ai.models.generateContent({
          model,
          contents,
          config: { systemInstruction },
        });
        return response;
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

    // 1. Intent classification → picks which prompt template to use.
    const intent = await classifyIntent(message);

    // 2. Retrieval. Job-library context only matters for match/interview/planning.
    const includeJobs = intent === 'job_match' || intent === 'interview_prep' || intent === 'career_planning';
    const { resumeChunks, jobChunks } = await retrieve({
      userId: user.id,
      query: message,
      includeJobs,
    });

    // 3. Prompt assembly.
    const systemInstruction = buildPrompt(intent, { user, resumeChunks, jobChunks });

    // 4. Build chat contents: prior history + latest user turn (with resume part).
    const contents = [];
    for (const entry of history) {
      const role = entry.role === 'assistant' ? 'model' : entry.role === 'user' ? 'user' : null;
      if (!role) continue;
      const text = entry.text || entry.content || '';
      contents.push({ role, parts: [{ text }] });
    }
    const resumePart = await buildResumePart(user.id);
    const latestParts = [];
    if (resumePart) latestParts.push(resumePart);
    latestParts.push({ text: message });
    contents.push({ role: 'user', parts: latestParts });

    // 5. Generate.
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
        job_chunks: jobChunks.map((c) => ({ id: c.id, job_id: c.job_id, title: c.job_title, score: Number(c.score.toFixed(4)) })),
      },
    });
  })
);

module.exports = router;
