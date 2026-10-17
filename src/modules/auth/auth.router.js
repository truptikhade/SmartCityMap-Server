import { Router } from "express";
const router = Router();
import cont from "./auth.controller.js";
const {
  register,
  registerDriver,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  sendVerification,
} = cont;

import auth from "../../middleware/auth.middleware.js";
const { protect } = auth;

import validate from "../../middleware/validate.middleware.js";

import rate from "../../middleware/rateLimit.middleware.js";
const { authLimiter, registerLimiter } = rate;
import vall from "./auth.validation.js";
const {
  registerSchema,
  driverRegisterSchema,
  loginSchema,
  changePasswordSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = vall;

//
// PUBLIC ROUTES
//

router.post("/register", registerLimiter, validate(registerSchema), register);

router.post(
  "/register/driver",
  registerLimiter,
  validate(driverRegisterSchema),
  registerDriver,
);

router.post("/login", authLimiter, validate(loginSchema), login);

// Forgot password
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

// Reset password
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

// Email verification
// User clicks the verification link from email.
router.get("/verify-email", verifyEmail);

//
// PROTECTED ROUTES
//

router.get("/profile", protect, getProfile);

router.put("/profile", protect, updateProfile);

router.put(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword,
);

router.delete("/profile", protect, validate(deleteAccountSchema), deleteAccount);

// Send / resend verification email
router.post("/send-verification", authLimiter, protect, sendVerification);

export default router;
