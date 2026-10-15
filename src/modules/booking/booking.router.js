import { Router } from "express";
const router = Router();

import controller from "./booking.controller.js";

import authMidl from "../../middleware/auth.middleware.js";
const { protect } = authMidl;
import validate from "../../middleware/validate.middleware.js";
import rateLimitMidl from "../../middleware/rateLimit.middleware.js";
const { bookingLimiter } = rateLimitMidl;
import bookingValidation from "./booking.validation.js";
const { createBookingSchema } = bookingValidation;

// All booking routes require login
router.use(protect);

router.post(
  "/",
  bookingLimiter,
  validate(createBookingSchema),
  controller.create,
);

router.get("/my", controller.getMyBookings);
router.get("/:id", controller.getById);
router.put("/:id/cancel", controller.cancel);

export default router;
