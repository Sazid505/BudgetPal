import express from "express";
import authCtrl from "../controllers/auth.controller.js";
import emailChecker from "../middlewares/emailChecker.js";

const router = express.Router();

// Public routes
router.post("/signup", emailChecker, authCtrl.signup);
router.post("/login", authCtrl.login);

// User routes
router.get("/signout", authCtrl.requireSignin, authCtrl.signout);
router.put("/profile", authCtrl.requireSignin, authCtrl.updateProfile);
router.put("/password", authCtrl.requireSignin, authCtrl.changePassword);
router.delete("/delete", authCtrl.requireSignin, authCtrl.deleteAccount);

// Admin routes
router.get("/users", authCtrl.requireSignin, authCtrl.requireAdmin, authCtrl.getAllUsers);
router.delete("/users/:id", authCtrl.requireSignin, authCtrl.requireAdmin, authCtrl.deleteUser);
router.get("/stats", authCtrl.requireSignin, authCtrl.requireAdmin, authCtrl.getAdminStats);

export default router;