const { getIO } = require('../../config/socket')

const emitBookingCancelled = (bookingId, data) => {
  try {
    const io = getIO()
    io.to(`booking:${bookingId}`).emit('booking:cancelled', {
      bookingId,
      ...data,
      cancelledAt: new Date().toISOString(),
    })
    console.log(`📡 Emitted booking:cancelled for ${bookingId}`)
  } catch (err) {
    // Don't throw — socket failure should never break booking cancel
    console.error('Socket emit error (booking:cancelled):', err.message)
  }
}

const emitBookingConfirmed = (bookingId, data) => {
  try {
    const io = getIO()
    io.to(`booking:${bookingId}`).emit('booking:confirmed', {
      bookingId,
      ...data,
    })
  } catch (err) {
    console.error('Socket emit error (booking:confirmed):', err.message)
  }
}

module.exports = { emitBookingCancelled, emitBookingConfirmed }