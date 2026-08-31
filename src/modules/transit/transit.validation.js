const Joi = require('joi')

const createRouteSchema = Joi.object({
  name:        Joi.string().min(2).required(),
  transitType: Joi.string().valid('bus', 'auto', 'shuttle', 'cab', 'metro').required(),
  startPoint:  Joi.string().required(),
  endPoint:    Joi.string().required(),
  baseFare:    Joi.number().min(0).required(),
  perKmRate:   Joi.number().min(0).required(),
})

const addStopSchema = Joi.object({
  name:     Joi.string().min(2).required(),
  lat:      Joi.number().required(),
  lng:      Joi.number().required(),
  sequence: Joi.number().integer().min(0).required(),
})

const nearbyStopsSchema = Joi.object({
  lat:    Joi.number().required(),
  lng:    Joi.number().required(),
  radius: Joi.number().min(100).max(10000).default(1500),
})

const addScheduleSchema = Joi.object({
  departureTime: Joi.string().required(),      // "HH:mm"
  arrivalTime:   Joi.string().required(),
  daysActive:    Joi.array().items(
    Joi.string().valid('mon','tue','wed','thu','fri','sat','sun')
  ).min(1).required(),
  vehicleNumber: Joi.string().allow('', null),
})

const fareEstimateSchema = Joi.object({
  routeId:    Joi.string().uuid().required(),
  distanceKm: Joi.number().positive().required(),
})

module.exports = {
  createRouteSchema,
  addStopSchema,
  nearbyStopsSchema,
  addScheduleSchema,
  fareEstimateSchema,
}