const express    = require('express')
const router     = express.Router()
const controller = require('./auth.controller')
const { protect }  = require('../../middleware/auth.middleware')
const validate     = require('../../middleware/validate.middleware')
const {
  authLimiter,
  registerLimiter,
  otpLimiter,
} = require('../../middleware/rateLimit.middleware')
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} = require('./auth.validation')

// ── Public Routes ──────────────────────────────────────────
router.post('/register',
  registerLimiter,              // ← max 10 per hour
  validate(registerSchema),
  controller.register
)

router.post('/login',
  authLimiter,                  // ← max 5 per 15 min
  validate(loginSchema),
  controller.login
)

// ── Protected Routes ───────────────────────────────────────
router.get('/profile',          protect, controller.getProfile)
router.put('/profile',          protect, controller.updateProfile)
router.put('/change-password',  protect, validate(changePasswordSchema), controller.changePassword)

module.exports = router