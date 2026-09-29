const bookingModel = (booking) => ({
  id:             booking.id,
  userId:         booking.userId,
  routeId:        booking.routeId,
  tripId:         booking.tripId,
  boardingStopId: booking.boardingStopId,
  dropStopId:     booking.dropStopId,
  transitType:    booking.transitType,
  seatNumber:     booking.seatNumber,
  farePaid:       booking.farePaid,
  travelDate:     booking.travelDate,
  status:         booking.status,
  bookedAt:       booking.bookedAt,
  // joined fields
  route:          booking.route   || null,
  trip:           booking.trip    || null,
  boardingStop:   booking.boardingStop || null,
  dropStop:       booking.dropStop     || null,
  payment:        booking.payment      || null,
})

module.exports = { bookingModel }