const express = require('express')

const router = express.Router()

const controller =
  require('./ai.controller')

const {
  protect,
} = require('../../middleware/auth.middleware')

router.get(
  '/recommendations',
  protect,
  controller.getRecommendations
)

router.get(
  '/specialties/:placeId',
  protect,
  controller.getSpecialties
)

module.exports = router