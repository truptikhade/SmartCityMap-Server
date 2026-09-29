const asyncHandler   = require('../../utils/asyncHandler')
const { successResponse } = require('../../utils/response')
const bookingService = require('./booking.service')

const create = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking({
    ...req.body,
    userId: req.user.id,
  })
  return successResponse(res, 201, 'Booking created successfully', booking)
})

const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getMyBookings(req.user.id)
  return successResponse(res, 200, 'Bookings fetched', bookings)
})

const getById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user.id)
  return successResponse(res, 200, 'Booking fetched', booking)
})

const cancel = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user.id)
  return successResponse(res, 200, 'Booking cancelled successfully', booking)
})

module.exports = { create, getMyBookings, getById, cancel }