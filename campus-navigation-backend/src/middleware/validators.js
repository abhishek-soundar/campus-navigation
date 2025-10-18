// src/middleware/validators.js
const { body } = require('express-validator');

exports.registerValidator = [
  body('name').isString().trim().isLength({ min: 2 }).withMessage('Name is required and must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'user']).withMessage('Role must be "admin" or "user"'),
];

exports.loginValidator = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password required'),
];

exports.nodeCreateValidator = [
  body('name').isString().trim().isLength({ min: 1 }).withMessage('Node name required'),
  body('type').isString().trim().isLength({ min: 1 }).withMessage('Node type required'),
  body('coordinates').exists().withMessage('Coordinates required'),
  body('coordinates.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('coordinates.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
];

exports.nodeUpdateValidator = [
  body('name').optional().isString().trim(),
  body('type').optional().isString().trim(),
  body('coordinates.lat').optional().isFloat({ min: -90, max: 90 }),
  body('coordinates.lng').optional().isFloat({ min: -180, max: 180 }),
];

exports.edgeCreateValidator = [
  body('from').isString().trim().notEmpty().withMessage('From node id required'),
  body('to').isString().trim().notEmpty().withMessage('To node id required'),
  body('distance').isNumeric().withMessage('Distance (meters) is required'),
];

exports.edgeUpdateValidator = [
  body('from').optional().isString().trim(),
  body('to').optional().isString().trim(),
  body('distance').optional().isNumeric(),
];
