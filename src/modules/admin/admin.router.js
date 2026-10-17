import { Router } from "express";
const router = Router();
import admin from "./admin.controller.js";
const {
  getAllDrivers,
  getDriverById,
  approveDriver,
  rejectDriver,
  getPendingVehicleChangeRequests,
  approveVehicleChangeRequest,
  rejectVehicleChangeRequest,
  createTransitSchedule,
} = admin;
import authMidl from "../../middleware/auth.middleware.js";
const { protect, restrictTo } = authMidl;
import validate from "../../middleware/validate.middleware.js";
import adminValidation from "./admin.validation.js";
const { createTransitScheduleSchema } = adminValidation;

router.use(protect, restrictTo("admin"));

router.post(
  "/transit/schedules",
  validate(createTransitScheduleSchema),
  createTransitSchedule,
);

// DRIVER APPROVAL

router.get("/drivers", getAllDrivers);

router.get("/drivers/:driverId", getDriverById);

router.put("/drivers/:driverId/approve", approveDriver);

router.put("/drivers/:driverId/reject", rejectDriver);

// VEHICLE CHANGE REQUESTS

router.get("/vehicle-change-requests", getPendingVehicleChangeRequests);

router.put(
  "/vehicle-change-requests/:requestId/approve",
  approveVehicleChangeRequest,
);

router.put(
  "/vehicle-change-requests/:requestId/reject",
  rejectVehicleChangeRequest,
);

export default router;
