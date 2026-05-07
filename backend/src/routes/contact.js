const express = require('express');
const { body } = require('express-validator');
const { collections } = require('../database');
const { catchErrors, validate } = require('../helpers');

const router = express.Router();

// POST /api/contact
router.post(
  '/',
  [
    body('fullname').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').isLength({ min: 20 }).withMessage('Message must be at least 20 characters'),
  ],
  catchErrors(async (req, res) => {
    validate(req);

    const { fullname, email, role, field, message } = req.body;

    await collections.contactMessages().insertOne({
      fullname,
      email,
      role: role || null,
      field: field || null,
      message,
      created_at: new Date(),
    });

    return res.status(201).json({ message: "Your message has been received. We'll be in touch soon!" });
  })
);

module.exports = router;
