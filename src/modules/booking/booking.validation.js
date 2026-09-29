const Joi = require('joi')

const createBookingSchema = Joi.object({
  routeId:        Joi.string().uuid().required(),
  tripId:         Joi.string().uuid().allow(null, ''),
  boardingStopId: Joi.string().uuid().allow(null, ''),
  dropStopId:     Joi.string().uuid().allow(null, ''),
  transitType:    Joi.string().valid('bus', 'train', 'auto').required(),
  seatNumber:     Joi.string().allow(null, ''),
  farePaid:       Joi.number().positive().required(),
  travelDate:     Joi.date().iso().required(),
})

module.exports = { createBookingSchema }