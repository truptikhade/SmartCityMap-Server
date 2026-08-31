const prisma = require('../../config/prisma')

const createBooking = async ({
  userId, routeId, tripId,
  boardingStopId, dropStopId,
  transitType, seatNumber,
  farePaid, travelDate,
}) => {
  return prisma.booking.create({
    data: {
      userId, routeId, tripId,
      boardingStopId, dropStopId,
      transitType, seatNumber,
      farePaid,
      travelDate: new Date(travelDate),
      status: 'pending',
    },
    include: {
      route:       true,
      trip:        true,
      boardingStop: true,
      dropStop:    true,
    },
  })
}

const findMyBookings = async (userId) => {
  return prisma.booking.findMany({
    where:   { userId },
    include: {
      route:        true,
      trip:         true,
      boardingStop: true,
      dropStop:     true,
      payment:      true,
    },
    orderBy: { bookedAt: 'desc' },
  })
}

const findBookingById = async (id) => {
  return prisma.booking.findUnique({
    where:   { id },
    include: {
      route:        true,
      trip:         true,
      boardingStop: true,
      dropStop:     true,
      payment:      true,
    },
  })
}

const updateBookingStatus = async (id, status) => {
  return prisma.booking.update({
    where: { id },
    data:  { status },
  })
}

const isSeatTaken = async ({ tripId, seatNumber, travelDate }) => {
  const booking = await prisma.booking.findFirst({
    where: {
      tripId,
      seatNumber,
      travelDate: new Date(travelDate),
      status:     { notIn: ['cancelled'] },
    },
  })
  return !!booking
}

module.exports = {
  createBooking,
  findMyBookings,
  findBookingById,
  updateBookingStatus,
  isSeatTaken,
}