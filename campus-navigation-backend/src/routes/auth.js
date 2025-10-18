// src/routes/auth.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, protect, firstRun } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../middleware/validators');
const handleValidation = require('../middleware/handleValidationResult');

const router = express.Router();

// Auth-specific rate limiter to prevent brute force on register/login
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 12, // limit each IP to 12 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests to auth endpoints, please try again shortly' },
});

// Public routes with validation + rate limiter
router.post('/register', authLimiter, registerValidator, handleValidation, register);
router.post('/login', authLimiter, loginValidator, handleValidation, login);

// Public first-run check (returns { needsRegistration: true/false })
router.get('/first-run', firstRun);

// Protected route
router.get('/session', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
