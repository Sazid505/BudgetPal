import db from "../models/db.js";
import { getCategoryId } from "../utils/categoryLookup.js";

const incomeCtrl = {};

// Get all income for the logged-in user.
incomeCtrl.getIncome = (req, res) => {
  const userId = req.user.id;
  db.query(
    "SELECT id, amount, date, description AS source FROM income WHERE user_id = ? ORDER BY id",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows || []);
    }
  );
};

// Create income for the logged-in user.
incomeCtrl.createIncome = (req, res) => {
  const userId = req.user.id;
  const { amount, source, date } = req.body;

  if (!amount) return res.status(400).json({ error: "Amount required" });

  const description = (source || "").trim() || null;

  getCategoryId(source, "income", (err, categoryId) => {
    if (err) return res.status(500).json({ error: "DB error" });

    db.query(
      "INSERT INTO income (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)",
      [userId, categoryId, amount, description, date || null],
      (err, result) => {
        if (err) return res.status(500).json({ error: "DB error" });
        res.status(201).json({ message: "Income recorded", id: result?.insertId });
      }
    );
  });
};

// Update an existing income for the logged-in user.
incomeCtrl.updateIncome = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { amount, source, date } = req.body;

  if (!amount) return res.status(400).json({ error: "Amount required" });

  const description = (source || "").trim() || null;

  getCategoryId(source, "income", (err, categoryId) => {
    if (err) return res.status(500).json({ error: "DB error" });

    db.query(
      "UPDATE income SET category_id = ?, amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?",
      [categoryId, amount, description, date || null, id, userId],
      (err, result) => {
        if (err) return res.status(500).json({ error: "DB error" });
        if (result?.affectedRows === 0) return res.status(404).json({ error: "Income not found" });
        res.json({ message: "Income updated" });
      }
    );
  });
};

// Delete income for the logged-in user.
incomeCtrl.deleteIncome = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  db.query("DELETE FROM income WHERE id = ? AND user_id = ?", [id, userId], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result?.affectedRows === 0) return res.status(404).json({ error: "Income not found" });
    res.json({ message: "Income deleted" });
  });
};

export default incomeCtrl;
