import express from "express";
import authCtrl from "../controllers/auth.controller.js";
import expenseCtrl, { getAllExpenses } from "../controllers/expense.controller.js";
import categoryCtrl from "../controllers/category.controller.js";

const router = express.Router();

// Getting all the categories from python script for the user and it requires the user to be logged in
router.get("/categories", authCtrl.requireSignin, categoryCtrl.getCategories);

// POST request that takes text description of expense in the request body and uses AI model to suggest a category
// Requires the user to be logged in
router.post("/predict-category", authCtrl.requireSignin, categoryCtrl.predictCategory);

// Category CRUD — available to all logged-in users (used in the user Dashboard)
router.get("/categories/all", authCtrl.requireSignin, categoryCtrl.adminListCategories);
router.post("/categories/all", authCtrl.requireSignin, categoryCtrl.adminCreateCategory);
router.put("/categories/all/:id", authCtrl.requireSignin, categoryCtrl.adminUpdateCategory);
router.delete("/categories/all/:id", authCtrl.requireSignin, categoryCtrl.adminDeleteCategory);

// Admin: getting all expenses from all users.
router.get("/all", authCtrl.requireSignin, authCtrl.requireAdmin, getAllExpenses);

// Getting all expenses belonging to the user.
router.get("/", authCtrl.requireSignin, expenseCtrl.getExpenses);
// Creating a new expense for the user.
router.post("/", authCtrl.requireSignin, expenseCtrl.createExpense);
// Updating an existing expense for the user.
router.put("/:id", authCtrl.requireSignin, expenseCtrl.updateExpense);
// Deleting an existing expense for the user.
router.delete("/:id", authCtrl.requireSignin, expenseCtrl.deleteExpense);

export default router;
