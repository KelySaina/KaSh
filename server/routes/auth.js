const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// OAuth routes
router.get('/login', authController.login);
router.get('/callback', authController.callback);

// Protected routes
router.get('/me', verifyToken, authController.me);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
