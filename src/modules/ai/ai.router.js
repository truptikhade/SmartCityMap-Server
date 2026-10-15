import { Router } from "express";
const router = Router();
import controller from "./ai.controller.js";

import authMidl from "../../middleware/auth.middleware.js";
const { protect } = authMidl;

router.get("/recommendations", protect, controller.getRecommendations);

router.get("/specialties/:placeId", protect, controller.getSpecialties);

export default router;
