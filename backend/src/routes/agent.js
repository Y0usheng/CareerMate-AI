const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const config = require('../config');
const { catchErrors, validate } = require('../helpers');
const { InputError } = require('../errors');
const { runAgent } = require('../lib/agent');

const router = express.Router();

// POST /api/agent
//
// The multi-step LangGraph agent: classify -> retrieve -> generate ->
// self-critique, looping back to retrieval if the draft isn't grounded.
// Same auth + request shape as /api/chat ({ message, history }), so the
// frontend can call either. /api/chat stays the simple single-shot path.
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

    let result;
    try {
      result = await runAgent({ message, history, user: req.user });
    } catch (err) {
      console.error('agent run failed:', err);
      throw new InputError('The agent failed to produce a response. Please try again in a moment.');
    }

    return res.json(result);
  })
);

module.exports = router;
