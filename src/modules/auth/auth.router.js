const express = require('express')

const router = express.Router()

const controller =
  require('./auth.controller')

const {
  protect,
} = require('../../middleware/auth.middleware')

const validate =
  require('../../middleware/validate.middleware')

const {
  authLimiter,
  registerLimiter,
} = require('../../middleware/rateLimit.middleware')

const {
  registerSchema,
  driverRegisterSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('./auth.validation')

// ─────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────

router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  controller.register
)

router.post(
  '/register/driver',
  registerLimiter,
  validate(driverRegisterSchema),
  controller.registerDriver
)

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  controller.login
)

// Forgot password
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  controller.forgotPassword
)

// Reset password
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  controller.resetPassword
)

// Email verification
// User clicks the verification link from email.
router.get(
  '/verify-email',
  controller.verifyEmail
)

// ─────────────────────────────────────────────────────────
// PROTECTED ROUTES
// ─────────────────────────────────────────────────────────

router.get(
  '/profile',
  protect,
  controller.getProfile
)

router.put(
  '/profile',
  protect,
  controller.updateProfile
)

router.put(
  '/change-password',
  protect,
  validate(changePasswordSchema),
  controller.changePassword
)

// Send / resend verification email
router.post(
  '/send-verification',
  authLimiter,
  protect,
  controller.sendVerification
)

module.exports = router