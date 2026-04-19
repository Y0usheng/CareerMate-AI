const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const db = require('../database');
const { catchErrors, validate } = require('../helpers');
const { InputError, ConflictError } = require('../errors');

const router = express.Router();

function formatProfile(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    field: user.field || null,
    career_goal: user.career_goal || null,
    stage: user.stage || null,
    skills: user.skills || null,
    onboarding_completed: user.onboarding_completed === 1,
    created_at: user.created_at,
  };
}

// GET /api/user/profile
router.get('/profile', requireAuth, catchErrors(async (req, res) => {
  return res.json(formatProfile(req.user));
}));

// PUT /api/user/profile
router.put(
  '/profile',
  requireAuth,
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  catchErrors(async (req, res) => {
    validate(req);

    const { full_name, email, field } = req.body;
    const userId = req.user.id;

    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
    if (existing) throw new ConflictError('Email already in use by another account');

    db.prepare(
      "UPDATE users SET full_name = ?, email = ?, field = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(full_name, email, field || null, userId);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    return res.json(formatProfile(updated));
  })
);

// PUT /api/user/career
router.put('/career', requireAuth, catchErrors(async (req, res) => {
  const { career_goal, stage, skills } = req.body;
  const userId = req.user.id;

  db.prepare(
    "UPDATE users SET career_goal = ?, stage = ?, skills = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(career_goal || null, stage || null, skills || null, userId);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return res.json(formatProfile(updated));
}));

// PUT /api/user/password
router.put(
  '/password',
  requireAuth,
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('confirm_password').notEmpty().withMessage('Confirm password is required'),
  ],
  catchErrors(async (req, res) => {
    validate(req);

    const { current_password, new_password, confirm_password } = req.body;
    const user = req.user;

    if (!bcrypt.compareSync(current_password, user.hashed_password)) {
      throw new InputError('Current password is incorrect');
    }
    if (new_password !== confirm_password) throw new InputError('New passwords do not match');

    const hashed = bcrypt.hashSync(new_password, 12);
    db.prepare("UPDATE users SET hashed_password = ?, updated_at = datetime('now') WHERE id = ?").run(hashed, user.id);

    return res.json({ message: 'Password updated successfully' });
  })
);

module.exports = router;
