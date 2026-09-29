const paymentModel = (payment) => ({
  id:            payment.id,
  bookingId:     payment.bookingId,
  amount:        payment.amount,
  method:        payment.method,
  status:        payment.status,
  transactionId: payment.transactionId,
  paidAt:        payment.paidAt,
  booking:       payment.booking || null,
})

module.exports = { paymentModel }