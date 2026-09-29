const rateLimit = require('express-rate-limit')

// ── Global Limiter ─────────────────────────────────────────
// Applied to all routes.
//
// Keep this high enough for normal application usage.
// Authentication and sensitive endpoints have their own
// stricter limiters below.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,                // 1000 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
})

// ── Auth Limiter ───────────────────────────────────────────
// Applied to login route — strict.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: true,
})

// ── Register Limiter ───────────────────────────────────────
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many accounts created. Please try again after 1 hour.',
  },
})

// ── OTP Limiter ────────────────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 15 minutes.',
  },
})

// ── API Limiter ────────────────────────────────────────────
// Applied to /api/* routes.
//
// Increased because the application has polling for:
// - passenger ride status
// - driver dashboard
// - live tracking
// - other API data
//
// Sensitive endpoints should use their own specific limiter.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many API requests. Please try again later.',
  },
})

// ── Booking Limiter ────────────────────────────────────────
// Prevent booking spam.
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many booking attempts. Please try again after 1 hour.',
  },
})

module.exports = {
  globalLimiter,
  authLimiter,
  registerLimiter,
  otpLimiter,
  apiLimiter,
  bookingLimiter,
}