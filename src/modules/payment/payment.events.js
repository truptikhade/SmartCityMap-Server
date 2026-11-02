import { emitToRoom } from "../../config/realtime.js";

const emitPaymentSuccess = async (bookingId, data) => {
  try {
    await emitToRoom(`booking:${bookingId}`, "payment:success", {
      bookingId,
      ...data,
    });
  } catch (err) {
    console.error("Socket emit error (payment:success):", err.message);
  }
};

const emitPaymentFailed = async (bookingId, data) => {
  try {
    await emitToRoom(`booking:${bookingId}`, "payment:failed", {
      bookingId,
      ...data,
    });
  } catch (err) {
    console.error("Socket emit error (payment:failed):", err.message);
  }
};

export default { emitPaymentSuccess, emitPaymentFailed };
