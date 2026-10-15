import { Router } from "express";
const router = Router();
import controller from "./places.controller.js";
import authMidl from "../../middleware/auth.middleware.js";
const { protect, restrictTo } = authMidl;
import validate from "../../middleware/validate.middleware.js";
import placeVal from "./places.validation.js";
const { createPlaceSchema, reviewSchema } = placeVal;

// Public routes
router.get("/nearby", controller.getNearby);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

// Reviews — need login

router.get("/:id/reviews", controller.getReviews);
router.post(
  "/:id/reviews",
  protect,
  validate(reviewSchema),
  controller.addReview,
);

// Admin only — create place
router.post(
  "/",
  protect,
  restrictTo("admin"),
  validate(createPlaceSchema),
  controller.create,
);

export default router;
