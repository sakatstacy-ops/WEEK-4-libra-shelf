const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticate, (req, res) => {
  res.status(200).json({
    data: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = router;