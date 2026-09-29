const prisma = require('../../config/prisma')

const createPayment = async ({ bookingId, amount, method, transactionId }) => {
  return prisma.payment.create({
    data: {
      bookingId,
      amount,
      method,
      transactionId,
      status: 'pending',
    },
  })
}

const findByBookingId = async (bookingId) => {
  return prisma.payment.findUnique({
    where:   { bookingId },
    include: { booking: true },
  })
}

const findByTransactionId = async (transactionId) => {
  return prisma.payment.findUnique({
    where: { transactionId },
  })
}

const updatePaymentStatus = async (transactionId, status) => {
  return prisma.payment.update({
    where: { transactionId },
    data:  {
      status,
      paidAt: status === 'success' ? new Date() : null,
    },
  })
}

module.exports = {
  createPayment,
  findByBookingId,
  findByTransactionId,
  updatePaymentStatus,
}