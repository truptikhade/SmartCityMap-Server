const Joi = require('joi')

const initiateSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
})

const verifySchema = Joi.object({
  razorpay_order_id:   Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature:  Joi.string().required(),
  bookingId:           Joi.string().uuid().required(),
})

module.exports = { initiateSchema, verifySchema }