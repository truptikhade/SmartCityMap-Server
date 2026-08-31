const express     = require('express')
const router      = express.Router()
const controller  = require('./places.controller')
const { protect, restrictTo } = require('../../middleware/auth.middleware')
const validate    = require('../../middleware/validate.middleware')
const {
  createPlaceSchema,
  reviewSchema,
} = require('./places.validation')

// Public routes
router.get('/nearby', controller.getNearby)
router.get('/',       controller.getAll)
router.get('/:id',    controller.getById)

// Reviews — need login
router.get('/:id/reviews',  controller.getReviews)
router.post('/:id/reviews',
  protect,
  validate(reviewSchema),
  controller.addReview
)

// Admin only — create place
router.post('/',
  protect,
  restrictTo('admin'),
  validate(createPlaceSchema),
  controller.create
)

module.exports = router