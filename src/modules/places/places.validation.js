const Joi = require('joi')

const nearbySchema = Joi.object({
  lat:      Joi.number().required(),
  lng:      Joi.number().required(),
  radius:   Joi.number().min(100).max(50000).default(2000),
  category: Joi.string().valid(
    'hospital', 'restaurant', 'market',
    'temple', 'atm', 'pharmacy',
    'school', 'hotel', 'park', 'other'
  ).optional(),
})

const createPlaceSchema = Joi.object({
  name:      Joi.string().min(2).required(),
  category:  Joi.string().required(),
  address:   Joi.string().allow('', null),
  openHours: Joi.string().allow('', null),
  lat:       Joi.number().required(),
  lng:       Joi.number().required(),
})

const reviewSchema = Joi.object({
  rating:  Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(500).allow('', null),
})

module.exports = { nearbySchema, createPlaceSchema, reviewSchema }