const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const db = require('../database');
const { catchErrors, validate } = require('../helpers');
const { NotFoundError } = require('../errors');

const router = express.Router();

function parseSkills(skills) {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  return skills.split(',').map((s) => s.trim()).filter(Boolean);
}

function formatOnboarding(record) {
  return {
    id: record.id,
    user_id: record.user_id,
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
  const record = db.prepare('SELECT * FROM onboarding_profiles WHERE user_id = ?').get(req.user.id);
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
    const userId = req.user.id;

    const skillsStr = Array.isArray(skills) ? skills.join(',') : (skills || null);

    const existing = db.prepare('SELECT id FROM onboarding_profiles WHERE user_id = ?').get(userId);
    let record;

    if (existing) {
      db.prepare(
        `UPDATE onboarding_profiles
         SET full_name = ?, role = ?, field = ?, skills = ?, target_role = ?, stage = ?, goal = ?, updated_at = datetime('now')
         WHERE user_id = ?`
      ).run(full_name, role, field, skillsStr, target_role || null, stage, goal || null, userId);
      record = db.prepare('SELECT * FROM onboarding_profiles WHERE user_id = ?').get(userId);
    } else {
      const result = db.prepare(
        `INSERT INTO onboarding_profiles (user_id, full_name, role, field, skills, target_role, stage, goal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(userId, full_name, role, field, skillsStr, target_role || null, stage, goal || null);
      record = db.prepare('SELECT * FROM onboarding_profiles WHERE id = ?').get(result.lastInsertRowid);
    }

    // Sync user fields
    db.prepare(
      `UPDATE users SET full_name = ?, field = ?, career_goal = ?, stage = ?, skills = ?,
       onboarding_completed = 1, updated_at = datetime('now') WHERE id = ?`
    ).run(full_name, field, goal || null, stage, skillsStr, userId);

    return res.status(201).json(formatOnboarding(record));
  })
);

module.exports = router;
