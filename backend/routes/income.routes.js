import express from "express";
import authCtrl from "../controllers/auth.controller.js";
import incomeCtrl from "../controllers/income.controller.js";

const router = express.Router();

// Getting all income entries belonging to the user.
router.get("/", authCtrl.requireSignin, incomeCtrl.getIncome);
// Creating a new income entry for the user.
router.post("/", authCtrl.requireSignin, incomeCtrl.createIncome);
// Updating an existing income entry for the user.
router.put("/:id", authCtrl.requireSignin, incomeCtrl.updateIncome);
// Deleting an existing income entry for the user.
router.delete("/:id", authCtrl.requireSignin, incomeCtrl.deleteIncome);

export default router;