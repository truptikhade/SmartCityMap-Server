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
} = admin;
import authMidl from "../../middleware/auth.middleware.js";
const { protect, restrictTo } = authMidl;

router.use(protect, restrictTo("admin"));

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
