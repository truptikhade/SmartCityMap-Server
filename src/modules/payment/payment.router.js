const express     = require('express')
const router      = express.Router()
const controller  = require('./payment.controller')
const { protect } = require('../../middleware/auth.middleware')
const validate    = require('../../middleware/validate.middleware')
const { initiateSchema, verifySchema } = require('./payment.validation')

// All payment routes require login
router.use(protect)

router.post('/initiate',
  validate(initiateSchema),
  controller.initiate
)

router.post('/verify',
  validate(verifySchema),
  controller.verify
)

router.get('/:bookingId',       controller.getStatus)
router.post('/:bookingId/refund', controller.refund)

module.exports = router