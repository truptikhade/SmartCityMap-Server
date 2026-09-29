const AppError      = require('../../utils/AppError')
const repo          = require('./booking.repository')
const { emitBookingCancelled } = require('./booking.events')
const { bookingModel } = require('./booking.model')


const createBooking = async (data) => {
  // 1. Check seat availability
  if (data.tripId && data.seatNumber) {
    const taken = await repo.isSeatTaken({
      tripId:     data.tripId,
      seatNumber: data.seatNumber,
      travelDate: data.travelDate,
    })
    if (taken) throw new AppError('Seat already booked for this date', 400)
  }

  // 2. Create booking
  const booking = await repo.createBooking(data)
  return bookingModel(booking)
}

const getMyBookings = async (userId) => {
  const bookings = await repo.findMyBookings(userId)
  return bookings.map(bookingModel)
}

const getBookingById = async (id, userId) => {
  const booking = await repo.findBookingById(id)
  if (!booking)                   throw new AppError('Booking not found', 404)
  if (booking.userId !== userId)  throw new AppError('Unauthorized', 403)
  return bookingModel(booking)
}

const cancelBooking = async (id, userId, bookingId) => {
  const booking = await repo.findBookingById(id)
 
  if (!booking)                   throw new AppError('Booking not found', 404)
  if (booking.userId !== userId)  throw new AppError('Unauthorized', 403)
  if (booking.status === 'cancelled') throw new AppError('Booking already cancelled', 400)
  if (booking.status === 'completed') throw new AppError('Completed booking cannot be cancelled', 400)

  const updated = await repo.updateBookingStatus(id, 'cancelled')
  emitBookingCancelled(id, {
    status:  'cancelled',
    userId,
  })
  return bookingModel(updated)
}

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking }