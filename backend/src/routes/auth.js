const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { collections } = require('../database');
const config = require('../config');
const { catchErrors, validate } = require('../helpers');
const { ConflictError, AccessError, InputError, NotFoundError } = require('../errors');
const { sendResetCodeEmail } = require('../lib/mailer');

const router = express.Router();

function createToken(userId) {
  const expiresIn = config.accessTokenExpireMinutes * 60;
  return jwt.sign({ sub: String(userId) }, config.secretKey, { expiresIn });
}

function formatUser(user) {
  const id = String(user._id);
  return {
    access_token: createToken(id),
    token_type: 'bearer',
    user_id: id,
    full_name: user.full_name,
    email: user.email,
    onboarding_completed: !!user.onboarding_completed,
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

    const users = collections.users();
    const existing = await users.findOne({ email });
    if (existing) throw new ConflictError('Email already registered');

    const hashed = bcrypt.hashSync(password, 12);
    const now = new Date();
    const doc = {
      full_name,
      email,
      hashed_password: hashed,
      field: null,
      career_goal: null,
      stage: null,
      skills: null,
      is_active: true,
      onboarding_completed: false,
      created_at: now,
      updated_at: now,
    };
    const result = await users.insertOne(doc);
    return res.status(201).json(formatUser({ ...doc, _id: result.insertedId }));
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

    const user = await collections.users().findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.hashed_password)) {
      throw new AccessError('Incorrect email or password', 401);
    }
    if (user.is_active === false) throw new AccessError('Account is inactive', 403);

    return res.json(formatUser(user));
  })
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  catchErrors(async (req, res) => {
    const { email } = req.body;

    const user = await collections.users().findOne({ email }, { projection: { _id: 1 } });
    if (user) {
      const code = String(Math.floor(1000 + Math.random() * 9000));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const codes = collections.passwordResetCodes();
      await codes.updateMany({ email, is_used: false }, { $set: { is_used: true } });
      await codes.insertOne({
        email,
        code,
        is_used: false,
        expires_at: expiresAt,
        created_at: new Date(),
      });

      try {
        await sendResetCodeEmail(email, code);
      } catch (err) {
        console.error('Failed to send reset email:', err.message);
      }
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

    const record = await collections.passwordResetCodes().findOne({
      email,
      code,
      is_used: false,
      expires_at: { $gt: new Date() },
    });

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

    const codes = collections.passwordResetCodes();
    const record = await codes.findOne({
      email,
      code,
      is_used: false,
      expires_at: { $gt: new Date() },
    });
    if (!record) throw new InputError('Invalid or expired code');

    const users = collections.users();
    const user = await users.findOne({ email });
    if (!user) throw new NotFoundError('User not found');

    const hashed = bcrypt.hashSync(password, 12);
    await users.updateOne(
      { _id: user._id },
      { $set: { hashed_password: hashed, updated_at: new Date() } }
    );
    await codes.updateOne({ _id: record._id }, { $set: { is_used: true } });

    return res.json({ message: 'Password reset successfully' });
  })
);

module.exports = router;
