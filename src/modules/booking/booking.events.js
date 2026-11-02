import { emitToRoom } from "../../config/realtime.js";

const emitBookingCancelled = async (bookingId, data) => {
  try {
    await emitToRoom(`booking:${bookingId}`, "booking:cancelled", {
      bookingId,
      ...data,
      cancelledAt: new Date().toISOString(),
    });
    console.log(`📡 Emitted booking:cancelled for ${bookingId}`);
  } catch (err) {
    // A socket failure should never break a booking cancel.
    console.error("Socket emit error (booking:cancelled):", err.message);
  }
};

const emitBookingConfirmed = async (bookingId, data) => {
  try {
    await emitToRoom(`booking:${bookingId}`, "booking:confirmed", {
      bookingId,
      ...data,
    });
  } catch (err) {
    console.error("Socket emit error (booking:confirmed):", err.message);
  }
};

export default { emitBookingCancelled, emitBookingConfirmed };
