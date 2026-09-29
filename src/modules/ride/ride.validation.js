const Joi = require('joi')

// ─────────────────────────────────────────────────────────
// CREATE RIDE REQUEST
// ─────────────────────────────────────────────────────────

const createRideSchema = Joi.object({
  pickupLat: Joi.number()
    .required(),

  pickupLng: Joi.number()
    .required(),

  pickupAddress: Joi.string()
    .trim()
    .max(500)
    .required(),

  destinationLat: Joi.number()
    .required(),

  destinationLng: Joi.number()
    .required(),

  destinationAddress: Joi.string()
    .trim()
    .max(500)
    .required(),

  distanceKm: Joi.number()
    .positive()
    .required(),

  durationMinutes: Joi.number()
    .positive()
    .required(),

  estimatedFare: Joi.number()
    .min(0)
    .required(),

  vehicleType: Joi.string()
    .valid('car', 'twoWheeler', 'auto')
    .required(),
})

// ─────────────────────────────────────────────────────────
// DRIVER ACCEPT RIDE
// ─────────────────────────────────────────────────────────

const acceptRideSchema = Joi.object({
  vehicleId: Joi.string()
    .uuid()
    .required(),
})

// ─────────────────────────────────────────────────────────
// DRIVER ARRIVED
// ─────────────────────────────────────────────────────────

const arrivedRideSchema = Joi.object({
  rideId: Joi.string()
    .uuid()
    .required(),
})

// ─────────────────────────────────────────────────────────
// VERIFY PASSENGER OTP
// ─────────────────────────────────────────────────────────

const verifyOtpSchema = Joi.object({
  otp: Joi.string()
    .pattern(/^[0-9]{4,6}$/)
    .required()
    .messages({
      'string.pattern.base':
        'OTP must contain 4 to 6 digits',
    }),
})

// ─────────────────────────────────────────────────────────
// COMPLETE RIDE
// ─────────────────────────────────────────────────────────

const completeRideSchema = Joi.object({
  finalFare: Joi.number()
    .min(0)
    .required(),
})

// ─────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────

module.exports = {
  createRideSchema,
  acceptRideSchema,
  arrivedRideSchema,
  verifyOtpSchema,
  completeRideSchema,
}