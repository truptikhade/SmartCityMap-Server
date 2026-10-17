const paymentModel = (payment) => ({
  id: payment.id,
  bookingId: payment.bookingId,
  amount: payment.amount,
  method: payment.method,
  status: payment.status,
  transactionId: payment.transactionId,
  razorpayPaymentId: payment.razorpayPaymentId,
  paidAt: payment.paidAt,
  booking: payment.booking || null,
});

export default { paymentModel };
