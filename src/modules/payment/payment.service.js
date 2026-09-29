const crypto     = require('crypto')
const Razorpay   = require('razorpay')
const AppError   = require('../../utils/AppError')
const repo       = require('./payment.repository')
const bookingRepo = require('../booking/booking.repository')
const { paymentModel } = require('./payment.model')
const { emitPaymentSuccess } = require('./payment.events')

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const initiatePayment = async ({ bookingId, userId }) => {
  // 1. Get booking
  const booking = await bookingRepo.findBookingById(bookingId)
  if (!booking)                  throw new AppError('Booking not found', 404)
  if (booking.userId !== userId) throw new AppError('Unauthorized', 403)
  if (booking.status !== 'pending') throw new AppError('Booking is not in pending state', 400)

  // 2. Check if payment already exists
  const existingPayment = await repo.findByBookingId(bookingId)
  if (existingPayment && existingPayment.status === 'success') {
    throw new AppError('Payment already completed', 400)
  }

  // 3. Create Razorpay order
  const order = await razorpay.orders.create({
    amount:   Math.round(booking.farePaid * 100), // paise
    currency: 'INR',
    receipt:  `booking_${bookingId}`,
    notes:    {
      bookingId,
      userId,
      transitType: booking.transitType,
    },
  })

  // 4. Save payment record
  await repo.createPayment({
    bookingId,
    amount:        booking.farePaid,
    method:        'razorpay',
    transactionId: order.id,
  })

  return {
    orderId:   order.id,
    amount:    order.amount,
    currency:  order.currency,
    keyId:     process.env.RAZORPAY_KEY_ID,
    bookingId,
  }
}

const verifyPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  bookingId,
}, io) => {
  // 1. Verify signature
  const body = `${razorpay_order_id}|${razorpay_payment_id}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    throw new AppError('Payment verification failed — invalid signature', 400)
  }

  // 2. Update payment to success
  const payment = await repo.updatePaymentStatus(razorpay_order_id, 'success')

  // 3. Update booking to confirmed
  await bookingRepo.updateBookingStatus(bookingId, 'confirmed')

  // 4. Notify anyone watching this booking (rider + driver rooms)
  emitPaymentSuccess(io, bookingId, paymentModel(payment))   // ← single emit, io passed in

  return paymentModel(payment)
}

const refundPayment = async (bookingId, userId) => {
  // 1. Get booking
  const booking = await bookingRepo.findBookingById(bookingId)
  if (!booking)                  throw new AppError('Booking not found', 404)
  if (booking.userId !== userId) throw new AppError('Unauthorized', 403)
  if (booking.status !== 'cancelled') throw new AppError('Only cancelled bookings can be refunded', 400)

  // 2. Get payment
  const payment = await repo.findByBookingId(bookingId)
  if (!payment)                        throw new AppError('Payment not found', 404)
  if (payment.status !== 'success')    throw new AppError('Only successful payments can be refunded', 400)

  // 3. Create Razorpay refund
  await razorpay.payments.refund(payment.transactionId, {
    amount: Math.round(payment.amount * 100), // paise
    notes:  { reason: 'Booking cancelled by user' },
  })

  // 4. Update payment status to refunded
  const updated = await repo.updatePaymentStatus(payment.transactionId, 'refunded')

  return paymentModel(updated)
}
const getPaymentStatus = async (bookingId, userId) => {
  // Verify booking belongs to user
  const booking = await bookingRepo.findBookingById(bookingId)
  if (!booking)                  throw new AppError('Booking not found', 404)
  if (booking.userId !== userId) throw new AppError('Unauthorized', 403)

  const payment = await repo.findByBookingId(bookingId)
  if (!payment) throw new AppError('Payment not found for this booking', 404)

  return paymentModel(payment)
}

module.exports = { initiatePayment, verifyPayment, getPaymentStatus, refundPayment }