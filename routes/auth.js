const crypto = require('node:crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const Session = require('../models/Session');
const User = require('../models/User');
const { authenticate, hashToken } = require('../middleware/auth');

const router = express.Router();
const sessionLifetimeMs = 1000 * 60 * 60 * 24;
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.AUTH_COOKIE_SECURE === 'true',
  sameSite: 'strict',
  path: '/',
  maxAge: sessionLifetimeMs,
};

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function validateCredentials(req, res, next) {
  const { email, password } = req.body || {};
  const fields = [];
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    fields.push({ field: 'email', message: 'must be a valid email address' });
  }
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    fields.push({ field: 'password', message: 'must be at least 12 characters and no more than 72 UTF-8 bytes' });
  }
  if (fields.length) {
    return res.status(400).json({ error: 'Validation failed', fields });
  }
  req.credentials = { email: email.trim().toLowerCase(), password };
  return next();
}

async function issueSession(user, res) {
  const token = crypto.randomBytes(32).toString('base64url');
  await Session.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + sessionLifetimeMs),
  });
  res.cookie('librarySession', token, cookieOptions);
  return token;
}

router.post('/register', validateCredentials, asyncRoute(async (req, res) => {
  const user = await User.create({
    email: req.credentials.email,
    passwordHash: await bcrypt.hash(req.credentials.password, 12),
    role: 'patron',
  });
  const token = await issueSession(user, res);
  res.status(201).json({
    data: { id: user._id, email: user.email, role: user.role },
    token,
    tokenType: 'Bearer',
    expiresIn: sessionLifetimeMs / 1000,
  });
}));

router.post('/login', validateCredentials, asyncRoute(async (req, res) => {
  const user = await User.findOne({ email: req.credentials.email }).select('+passwordHash');
  if (!user || !await bcrypt.compare(req.credentials.password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = await issueSession(user, res);
  return res.status(200).json({
    data: { id: user._id, email: user.email, role: user.role },
    token,
    tokenType: 'Bearer',
    expiresIn: sessionLifetimeMs / 1000,
  });
}));

router.post('/logout', authenticate, asyncRoute(async (req, res) => {
  await Session.deleteOne({ _id: req.session._id });
  res.clearCookie('librarySession', { ...cookieOptions, maxAge: undefined });
  return res.status(200).json({ message: 'Logged out' });
}));

module.exports = router;