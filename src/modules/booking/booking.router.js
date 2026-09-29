const express      = require('express')
const router       = express.Router()
const controller   = require('./booking.controller')
const { protect }  = require('../../middleware/auth.middleware')
const validate     = require('../../middleware/validate.middleware')
const { bookingLimiter } = require('../../middleware/rateLimit.middleware')
const { createBookingSchema } = require('./booking.validation')

// All booking routes require login
router.use(protect)

router.post('/',
  bookingLimiter,
  validate(createBookingSchema),
  controller.create
)

router.get('/my',        controller.getMyBookings)
router.get('/:id',       controller.getById)
router.put('/:id/cancel', controller.cancel)

module.exports = router