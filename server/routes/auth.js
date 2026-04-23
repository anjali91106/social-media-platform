const express = require('express');
const router = express.Router();
const { register, login, logout, refreshToken, getCurrentUser } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
