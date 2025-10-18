// src/middleware/handleValidationResult.js
const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // join messages into a single string for simpler client handling
    const msg = errors.array().map(e => e.msg).join('; ');
    return res.status(400).json({ success: false, error: msg });
  }
  next();
};
