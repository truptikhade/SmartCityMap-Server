import asyncHandler from "../../utils/asyncHandler.js";
import res from "../../utils/response.js";
const { successResponse } = res;
import bookingService from "./booking.service.js";

const create = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking({
    ...req.body,
    userId: req.user.id,
  }, req.get("Idempotency-Key"));
  return successResponse(res, 201, "Booking created successfully", booking);
});

const getTrainSeatInventory = asyncHandler(async (req, res) => {
  const inventory = await bookingService.getTrainSeatInventory(
    req.params.tripId,
  );
  return successResponse(res, 200, "Train seat inventory fetched", inventory);
});

const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getMyBookings(req.user.id);
  return successResponse(res, 200, "Bookings fetched", bookings);
});

const getById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(
    req.params.id,
    req.user.id,
  );
  return successResponse(res, 200, "Booking fetched", booking);
});

const cancel = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(
    req.params.id,
    req.user.id,
  );
  return successResponse(res, 200, "Booking cancelled successfully", booking);
});

export default { create, getTrainSeatInventory, getMyBookings, getById, cancel };
