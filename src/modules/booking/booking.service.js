import AppError from "../../utils/AppError.js";
import repo from "./booking.repository.js";
import bookingEvents from "./booking.events.js";
const { emitBookingCancelled } = bookingEvents;
import bookingModelModule from "./booking.model.js";
const { bookingModel } = bookingModelModule;

const createBooking = async (data, idempotencyKey) => {
  const transitType = String(data.transitType || "").toLowerCase();
  if (transitType === "train") {
    if (!data.tripId || !data.seatNumber) {
      throw new AppError("Select a train trip and seat", 400);
    }
    if (!idempotencyKey || !/^[\w.:-]{8,128}$/.test(idempotencyKey)) {
      throw new AppError("A valid Idempotency-Key header is required", 400);
    }
  }

  const booking = await repo.createBooking({
    ...data,
    travelDate: data.travelDate.slice(0, 10),
    idempotencyKey,
  });
  return bookingModel(booking);
};

const getTrainSeatInventory = async (tripId) => {
  const inventory = await repo.findTrainSeatInventory(tripId);
  if (!inventory) throw new AppError("Train trip not found", 404);
  return inventory;
};

const getMyBookings = async (userId) => {
  const bookings = await repo.findMyBookings(userId);
  return bookings.map(bookingModel);
};

const getBookingById = async (id, userId) => {
  const booking = await repo.findBookingById(id);
  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.userId !== userId) throw new AppError("Unauthorized", 403);
  return bookingModel(booking);
};

const cancelBooking = async (id, userId) => {
  const booking = await repo.findBookingById(id);

  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.userId !== userId) throw new AppError("Unauthorized", 403);
  if (booking.status === "cancelled")
    throw new AppError("Booking already cancelled", 400);
  if (booking.status === "completed")
    throw new AppError("Completed booking cannot be cancelled", 400);

  const updated = await repo.updateBookingStatus(id, "cancelled");
  emitBookingCancelled(id, {
    status: "cancelled",
    userId,
  });
  return bookingModel(updated);
};

export default {
  createBooking,
  getTrainSeatInventory,
  getMyBookings,
  getBookingById,
  cancelBooking,
};
