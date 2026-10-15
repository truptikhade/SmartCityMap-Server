import { Router } from "express";
const router = Router();

import controller from "./payment.controller.js";

import authMidl from "../../middleware/auth.middleware.js";
const { protect } = authMidl;

import validate from "../../middleware/validate.middleware.js";

import paymentValidation from "./payment.validation.js";
const { initiateSchema, verifySchema } = paymentValidation;

// All payment routes require login
router.use(protect);

router.post("/initiate", validate(initiateSchema), controller.initiate);

router.post("/verify", validate(verifySchema), controller.verify);

router.get("/:bookingId", controller.getStatus);
router.post("/:bookingId/refund", controller.refund);

export default router;
