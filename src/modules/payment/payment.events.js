const emitPaymentSuccess = (io, bookingId, payment) => {
  io.to(`booking:${bookingId}`).emit('payment:success', {
    bookingId, payment, updatedAt: new Date(),
  })
}

const emitPaymentFailed = (io, bookingId, reason) => {
  io.to(`booking:${bookingId}`).emit('payment:failed', {
    bookingId, reason, updatedAt: new Date(),
  })
}

module.exports = { emitPaymentSuccess, emitPaymentFailed }