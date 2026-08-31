const rateLimit = require('express-rate-limit')

// ── Global Limiter ─────────────────────────────────────────
// Applied to ALL routes
const globalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,  // 15 minutes
  max:              100,              // 100 requests per 15 min
  standardHeaders:  true,            // Return rate limit info in headers
  legacyHeaders:    false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
})

// ── Auth Limiter ───────────────────────────────────────────
// Applied to login route — strict
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // 15 minutes
  max:             5,               // Only 5 login attempts
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: true,     // Don't count successful logins
})

// ── Register Limiter ───────────────────────────────────────
const registerLimiter = rateLimit({
  windowMs:        60 * 60 * 1000, // 1 hour
  max:             10,             // 10 registrations per hour per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many accounts created. Please try again after 1 hour.',
  },
})

// ── OTP Limiter ────────────────────────────────────────────
const otpLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             3,              // Only 3 OTP requests
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 15 minutes.',
  },
})

// ── API Limiter ────────────────────────────────────────────
// Applied to all /api/* routes
const apiLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             200,            // 200 API requests per 15 min
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many API requests. Please try again after 15 minutes.',
  },
})

// ── Booking Limiter ────────────────────────────────────────
// Prevent booking spam
const bookingLimiter = rateLimit({
  windowMs:        60 * 60 * 1000, // 1 hour
  max:             20,             // 20 bookings per hour
  standardHeaders: true,
  legacyHeaders:   false,
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