import express from "express";
import authCtrl from "../controllers/auth.controller.js";
import { forecastTotal, forecastCategory } from "../controllers/forecast.controller.js";

const router = express.Router();

// GET /api/forecast/total — predict next 3 months total spending
router.get("/total", authCtrl.requireSignin, forecastTotal);

// GET /api/forecast/category — predict next 3 months per category
router.get("/category", authCtrl.requireSignin, forecastCategory);

export default router;
