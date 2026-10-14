const crypto = require('node:crypto');
const Session = require('../models/Session');
const User = require('../models/User');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getToken(req) {
  const authorization = req.get('authorization');
  if (authorization && /^Bearer\s+/i.test(authorization)) {
    return authorization.replace(/^Bearer\s+/i, '').trim();
  }
  return req.cookies?.librarySession || null;
}

function authenticate(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  return Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } })
    .populate('user')
    .then((session) => {
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      req.user = session.user;
      req.session = session;
      return next();
    })
    .catch(next);
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

module.exports = { authenticate, authorize, hashToken };