const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { userValidation } = require('../middleware/validation');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', userValidation.register, AuthController.register);
router.post('/login', userValidation.login, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.use(auth.authMiddleware);

router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);
router.post('/change-password', AuthController.changePassword);
router.post('/logout', AuthController.logout);

module.exports = router;
