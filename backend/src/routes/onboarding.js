const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { collections } = require('../database');
const { catchErrors, validate } = require('../helpers');
const { NotFoundError } = require('../errors');

const router = express.Router();

function parseSkills(skills) {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  return String(skills).split(',').map((s) => s.trim()).filter(Boolean);
}

function formatOnboarding(record) {
  return {
    id: String(record._id),
    user_id: String(record.user_id),
    full_name: record.full_name || null,
    role: record.role || null,
    field: record.field || null,
    skills: parseSkills(record.skills),
    target_role: record.target_role || null,
    stage: record.stage || null,
    goal: record.goal || null,
    created_at: record.created_at,
  };
}

// GET /api/onboarding
router.get('/', requireAuth, catchErrors(async (req, res) => {
  const record = await collections.onboarding().findOne({ user_id: req.user._id });
  if (!record) throw new NotFoundError('Onboarding profile not found');
  return res.json(formatOnboarding(record));
}));

// POST /api/onboarding
router.post(
  '/',
  requireAuth,
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('role').notEmpty().withMessage('Role is required'),
    body('field').notEmpty().withMessage('Field is required'),
    body('stage').notEmpty().withMessage('Stage is required'),
  ],
  catchErrors(async (req, res) => {
    validate(req);

    const { full_name, role, field, skills, target_role, stage, goal } = req.body;
    const userId = req.user._id;
    const skillsStr = Array.isArray(skills) ? skills.join(',') : (skills || null);

    const onboarding = collections.onboarding();
    const now = new Date();

    await onboarding.updateOne(
      { user_id: userId },
      {
        $set: {
          user_id: userId,
          full_name,
          role,
          field,
          skills: skillsStr,
          target_role: target_role || null,
          stage,
          goal: goal || null,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true }
    );

    const record = await onboarding.findOne({ user_id: userId });

    // Sync user fields — career_goal stores the target role.
    await collections.users().updateOne(
      { _id: userId },
      {
        $set: {
          full_name,
          field,
          career_goal: target_role || goal || null,
          stage,
          skills: skillsStr,
          onboarding_completed: true,
          updated_at: now,
        },
      }
    );

    return res.status(201).json(formatOnboarding(record));
  })
);

module.exports = router;
