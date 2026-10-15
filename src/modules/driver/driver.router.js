import { Router } from "express";
const router = Router();
import controller from "./driver.controller.js";

import authMidl from "../../middleware/auth.middleware.js";
const { protect, restrictTo } = authMidl;
router.use(protect, restrictTo("driver"));

// Dashboard
router.get("/dashboard", controller.getDashboard);

// Profile
router.get("/profile", controller.getProfile);

router.put("/profile", controller.updateProfile);

// Vehicles
router.get("/vehicles", controller.getVehicles);

router.post("/vehicles", controller.requestVehicleChange);

// Vehicle change request history
router.get("/vehicle-change-requests", controller.getVehicleChangeRequests);

// Availability
router.put("/availability", controller.updateAvailability);
export default router;
