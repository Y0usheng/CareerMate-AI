const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const db = require('../database');
const config = require('../config');
const { catchErrors, validate } = require('../helpers');
const { ConflictError, AccessError, InputError, NotFoundError } = require('../errors');

const router = express.Router();

function createToken(userId) {
  const expiresIn = config.accessTokenExpireMinutes * 60;
  return jwt.sign({ sub: String(userId) }, config.secretKey, { expiresIn });
}

function formatUser(user) {
  return {
    access_token: createToken(user.id),
    token_type: 'bearer',
    user_id: user.id,
    full_name: user.full_name,
    email: user.email,
    onboarding_completed: user.onboarding_completed === 1,
  };
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  catchErrors(async (req, res) => {
    validate(req);

    const { full_name, email, password } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) throw new ConflictError('Email already registered');

    const hashed = bcrypt.hashSync(password, 12);
    const result = db
      .prepare('INSERT INTO users (full_name, email, hashed_password) VALUES (?, ?, ?)')
      .run(full_name, email, hashed);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(formatUser(user));
  })
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  catchErrors(async (req, res) => {
    validate(req);

    const { email, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.hashed_password)) {
      throw new AccessError('Incorrect email or password', 401);
    }
    if (!user.is_active) throw new AccessError('Account is inactive', 403);

    return res.json(formatUser(user));
  })
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  catchErrors(async (req, res) => {
    const { email } = req.body;

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (user) {
      const code = String(Math.floor(1000 + Math.random() * 9000));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      db.prepare('UPDATE password_reset_codes SET is_used = 1 WHERE email = ? AND is_used = 0').run(email);
      db.prepare('INSERT INTO password_reset_codes (email, code, expires_at) VALUES (?, ?, ?)').run(email, code, expiresAt);

      // In production, send via email. For dev, log to console.
      console.log(`[DEV] Password reset code for ${email}: ${code}`);
    }

    // Always 200 to prevent email enumeration
    return res.json({ message: "If this email is registered, a code has been sent." });
  })
);

// POST /api/auth/verify-code
router.post(
  '/verify-code',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('code').notEmpty().withMessage('Code is required'),
  ],
  catchErrors(async (req, res) => {
    validate(req);

    const { email, code } = req.body;
    const now = new Date().toISOString();

    const record = db
      .prepare('SELECT * FROM password_reset_codes WHERE email = ? AND code = ? AND is_used = 0 AND expires_at > ?')
      .get(email, code, now);

    if (!record) throw new InputError('Invalid or expired code');

    return res.json({ message: 'Code verified successfully' });
  })
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('code').notEmpty().withMessage('Code is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirm_password').notEmpty().withMessage('Confirm password is required'),
  ],
  catchErrors(async (req, res) => {
    validate(req);

    const { email, code, password, confirm_password } = req.body;

    if (password !== confirm_password) throw new InputError('Passwords do not match');

    const now = new Date().toISOString();
    const record = db
      .prepare('SELECT * FROM password_reset_codes WHERE email = ? AND code = ? AND is_used = 0 AND expires_at > ?')
      .get(email, code, now);

    if (!record) throw new InputError('Invalid or expired code');

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) throw new NotFoundError('User not found');

    const hashed = bcrypt.hashSync(password, 12);
    db.prepare("UPDATE users SET hashed_password = ?, updated_at = datetime('now') WHERE id = ?").run(hashed, user.id);
    db.prepare('UPDATE password_reset_codes SET is_used = 1 WHERE id = ?').run(record.id);

    return res.json({ message: 'Password reset successfully' });
  })
);

module.exports = router;
