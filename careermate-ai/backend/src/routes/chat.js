const express = require('express');
const { body } = require('express-validator');
const Anthropic = require('@anthropic-ai/sdk');
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

  let prompt = `You are CareerMate AI, a personalized career development assistant. Your role is to help users with career planning, job searching, resume improvement, interview preparation, and professional development.

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
- Use bullet points and structured formatting when helpful`;

  // Attach resume context if available
  const resume = db
    .prepare('SELECT extracted_text FROM resumes WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1')
    .get(user.id);

  if (resume && resume.extracted_text) {
    prompt += `\n\nUser's resume content:\n${resume.extracted_text.slice(0, 3000)}`;
  }

  return prompt;
}

// POST /api/chat
router.post(
  '/',
  requireAuth,
  [body('message').trim().notEmpty().withMessage('Message is required')],
  catchErrors(async (req, res) => {
    validate(req);

    if (!config.anthropicApiKey) {
      throw new InputError('AI service is not configured. Please set ANTHROPIC_API_KEY.');
    }

    const { message, history = [] } = req.body;
    const user = req.user;

    const messages = [];
    for (const entry of history) {
      if (entry.role === 'user' || entry.role === 'assistant') {
        messages.push({ role: entry.role, content: entry.text || entry.content || '' });
      }
    }
    messages.push({ role: 'user', content: message });

    const client = new Anthropic({ apiKey: config.anthropicApiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystemPrompt(user),
      messages,
    });

    const reply = response.content[0]?.text || '';
    return res.json({ reply });
  })
);

module.exports = router;
