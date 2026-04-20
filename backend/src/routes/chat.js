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

const router = express.Router();

function buildSystemPrompt(user) {
  const skills = user.skills
    ? user.skills.split(',').map((s) => s.trim()).filter(Boolean).join(', ')
    : 'not specified';

  return `You are CareerMate AI, a personalized career development assistant. Your role is to help users with career planning, job searching, resume improvement, interview preparation, and professional development.

Current user profile:
- Name: ${user.full_name}
- Career field: ${user.field || 'not specified'}
- Career goal: ${user.career_goal || 'not specified'}
- Current stage: ${user.stage || 'not specified'}
- Skills: ${skills}

Guidelines:
- Be encouraging, specific, and actionable in your advice
- Tailor your responses to the user's career stage and goals
- Provide concrete, practical suggestions
- Keep responses focused and concise
- Use bullet points and structured formatting when helpful
- If the user has attached their resume (as a PDF file or included as text), analyze it thoroughly before answering`;
}

/**
 * Returns a Gemini `part` representing the user's active resume, or null if none.
 * - PDF: inline base64 so Gemini reads the full document natively (layout/images).
 * - DOCX: extracted via mammoth → wrapped as a text part.
 * - Unsupported / read failure: null (chat continues without resume context).
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
    return null; // .doc unsupported
  } catch (err) {
    console.error('Failed to load resume for chat:', err.message);
    return null;
  }
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

    const contents = [];
    for (const entry of history) {
      const role = entry.role === 'assistant' ? 'model' : entry.role === 'user' ? 'user' : null;
      if (!role) continue;
      const text = entry.text || entry.content || '';
      contents.push({ role, parts: [{ text }] });
    }

    // Build the latest user message, attaching the resume file as an inline part.
    const resumePart = await buildResumePart(user.id);
    const latestParts = [];
    if (resumePart) latestParts.push(resumePart);
    latestParts.push({ text: message });
    contents.push({ role: 'user', parts: latestParts });

    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    const systemInstruction = buildSystemPrompt(user);

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
          lastErr = null;
          break outer;
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

    if (lastErr) {
      throw new InputError('Gemini is overloaded right now. Please try again in a moment.');
    }

    const reply = response.text || '';
    return res.json({ reply });
  })
);

module.exports = router;
