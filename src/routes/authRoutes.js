const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login-with-otp', authController.loginWithOTP);
router.post('/verify-login-otp', authController.verifyLoginOTP);

module.exports = router;