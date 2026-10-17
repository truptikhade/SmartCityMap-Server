import asyncHandler from "../../utils/asyncHandler.js";
import res from "../../utils/response.js";
const { successResponse } = res;
import paymentService from "./payment.service.js";

const initiate = asyncHandler(async (req, res) => {
  const data = await paymentService.initiatePayment({
    bookingId: req.body.bookingId,
    userId: req.user.id,
  });
  return successResponse(res, 200, "Payment initiated", data);
});

const verify = asyncHandler(async (req, res) => {
  const data = await paymentService.verifyPayment(
    req.body,
    req.app.get("io"),
    req.user.id,
  );
  return successResponse(res, 200, "Payment verified successfully", data);
});

const getStatus = asyncHandler(async (req, res) => {
  const data = await paymentService.getPaymentStatus(
    req.params.bookingId,
    req.user.id,
  );
  return successResponse(res, 200, "Payment status fetched", data);
});

const refund = asyncHandler(async (req, res) => {
  const data = await paymentService.refundPayment(
    req.params.bookingId,
    req.user.id,
  );
  return successResponse(res, 200, "Refund initiated successfully", data);
});

export default { initiate, verify, getStatus, refund };
