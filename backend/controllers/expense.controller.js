import db from "../models/db.js";
import { getCategoryId } from "../utils/categoryLookup.js";

const expenseCtrl = {};

// Get all expenses for the logged-in user.
expenseCtrl.getExpenses = (req, res) => {
  const userId = req.user.id;
  db.query(
    "SELECT e.id, e.description, e.amount, e.date, c.name AS category FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.user_id = ? ORDER BY e.id",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows || []);
    }
  );
};

// Create an expense for the logged-in user.
expenseCtrl.createExpense = (req, res) => {
  const userId = req.user.id;
  const { description, amount, category, date } = req.body;

  if (!amount) return res.status(400).json({ error: "Amount required" });

  getCategoryId(category, "expense", (err, categoryId) => {
    if (err) return res.status(500).json({ error: "DB error" });

    db.query(
      "INSERT INTO expenses (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)",
      [userId, categoryId, amount, description || null, date || null],
      (err, result) => {
        if (err) return res.status(500).json({ error: "DB error" });
        res.status(201).json({ message: "Expense recorded", id: result?.insertId });
      }
    );
  });
};

// Update an existing expense for the logged-in user.
expenseCtrl.updateExpense = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { description, amount, category, date } = req.body;

  if (!amount) return res.status(400).json({ error: "Amount required" });

  getCategoryId(category, "expense", (err, categoryId) => {
    if (err) return res.status(500).json({ error: "DB error" });

    db.query(
      "UPDATE expenses SET category_id = ?, amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?",
      [categoryId, amount, description || null, date || null, id, userId],
      (err, result) => {
        if (err) return res.status(500).json({ error: "DB error" });
        if (result?.affectedRows === 0) return res.status(404).json({ error: "Expense not found" });
        res.json({ message: "Expense updated" });
      }
    );
  });
};

// Delete an existing expense for the logged-in user.
expenseCtrl.deleteExpense = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  db.query("DELETE FROM expenses WHERE id = ? AND user_id = ?", [id, userId], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result?.affectedRows === 0) return res.status(404).json({ error: "Expense not found" });
    res.json({ message: "Expense deleted" });
  });
};

// Admin: get ALL expenses from all users with user and category info.
export const getAllExpenses = (req, res) => {
  db.query(
    `SELECT e.id, e.description, e.amount, e.date,
            c.name AS category,
            u.name AS user_name, u.email AS user_email
     FROM expenses e
     LEFT JOIN categories c ON e.category_id = c.id
     LEFT JOIN users u ON e.user_id = u.id
     ORDER BY e.date DESC, e.id DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(results);
    }
  );
};

export default expenseCtrl;
