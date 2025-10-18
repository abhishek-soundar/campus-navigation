// src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ success:false, error: 'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success:false, error: 'User already exists' });
    const user = await User.create({ name, email, password, role: role || 'user' });
    const token = signToken(user);
    res.status(201).json({ success:true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success:false, error: 'Missing credentials' });
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success:false, error: 'Invalid credentials' });
    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ success:false, error: 'Invalid credentials' });
    const token = signToken(user);
    res.status(200).json({ success:true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    const auth = req.headers.authorization || '';
    if (auth && auth.startsWith('Bearer ')) token = auth.split(' ')[1];
    if (!token) return res.status(401).json({ success:false, error: 'Not authorized' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success:false, error: 'No user found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success:false, error: 'Token invalid or expired' });
  }
};

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ success:false, error: 'Forbidden' });
  next();
};

/**
 * firstRun
 * Public endpoint to check whether there are zero users.
 * Useful for frontend to decide whether to show registration page on first visit.
 * Response: { needsRegistration: true | false }
 */
exports.firstRun = async (req, res, next) => {
  try {
    const count = await User.countDocuments({});
    // if no users, registration should be allowed / shown
    res.status(200).json({ success: true, needsRegistration: count === 0 });
  } catch (err) {
    next(err);
  }
};
