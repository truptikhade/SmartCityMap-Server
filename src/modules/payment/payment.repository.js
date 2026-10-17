import prisma from "../../config/prisma.js";

const createPayment = async ({
  bookingId,
  amount,
  method,
  transactionId,
}) => {
  return prisma.payment.upsert({
    where: { bookingId },
    update: {
      amount,
      method,
      transactionId,
      status: "pending",
      razorpayPaymentId: null,
      paidAt: null,
    },
    create: {
      bookingId,
      amount,
      method,
      transactionId,
      status: "pending",
    },
  });
};

const findByBookingId = async (bookingId) => {
  return prisma.payment.findUnique({
    where: { bookingId },
    include: { booking: true },
  });
};

const updatePaymentStatus = async (transactionId, status) => {
  return prisma.payment.update({
    where: { transactionId },
    data: {
      status,
      ...(status === "success" ? { paidAt: new Date() } : {}),
    },
  });
};

const completePayment = async (transactionId, razorpayPaymentId, bookingId) =>
  prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { transactionId },
      data: {
        status: "success",
        razorpayPaymentId,
        paidAt: new Date(),
      },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "confirmed" },
    });

    return payment;
  });

export default {
  createPayment,
  findByBookingId,
  updatePaymentStatus,
  completePayment,
};
