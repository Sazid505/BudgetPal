import path from "path";
import { parseJsonFromStdout, runPython } from "../utils/python.js";
import db from "../models/db.js";

const scriptDir = process.cwd();
const scriptPath = path.join(scriptDir, "predict_category.py");

const categoryCtrl = {};

categoryCtrl.getCategories = async (req, res) => {
  try {
    const { stdout, stderr } = await runPython(["-u", scriptPath, "--labels"], { cwd: scriptDir });
    const data = parseJsonFromStdout(stdout);
    const categories = Array.isArray(data.categories)
      ? data.categories.filter((c) => typeof c === "string" && c.trim())
      : [];
    if (categories.length > 0) return res.json({ categories });
    res.json({
      categories: ["Other"],
      warning: data.warning || stderr.trim() || "Could not load categories."
    });
  } catch {
    res.status(500).json({ error: "Could not run Python. Is Python installed?" });
  }
};

categoryCtrl.predictCategory = async (req, res) => {
  const desc = String(req.body?.description ?? req.body?.text ?? "").trim();
  if (!desc) return res.json({ category: "Other" });
  try {
    const { stdout, stderr } = await runPython(["-u", scriptPath, desc], { cwd: scriptDir });
    const data = parseJsonFromStdout(stdout);
    const category = typeof data.category === "string" && data.category.trim() ? data.category.trim() : "Other";
    res.json({
      category,
      warning: data.warning || undefined,
      error: data.error || undefined,
      stderr: stderr.trim() || undefined
    });
  } catch {
    res.status(500).json({ error: "Could not run Python. Is Python installed?" });
  }
};

// Admin: list ALL categories from the database with usage counts.
categoryCtrl.adminListCategories = (req, res) => {
  db.query(
    `SELECT c.id, c.name, c.type,
            COUNT(e.id) AS expense_count
     FROM categories c
     LEFT JOIN expenses e ON e.category_id = c.id
     GROUP BY c.id
     ORDER BY c.type, c.name`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows || []);
    }
  );
};

// Admin: create a new category.
categoryCtrl.adminCreateCategory = (req, res) => {
  const { name, type } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Category name is required." });
  if (!["expense", "income"].includes(type)) return res.status(400).json({ error: "Type must be 'expense' or 'income'." });
  db.query(
    "INSERT INTO categories (name, type) VALUES (?, ?)",
    [name.trim(), type],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Category already exists or DB error." });
      res.status(201).json({ id: result.insertId, name: name.trim(), type, expense_count: 0 });
    }
  );
};

// Admin: rename an existing category.
categoryCtrl.adminUpdateCategory = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Name is required." });
  db.query(
    "UPDATE categories SET name = ? WHERE id = ?",
    [name.trim(), id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error." });
      if (result.affectedRows === 0) return res.status(404).json({ error: "Category not found." });
      res.json({ message: "Category renamed." });
    }
  );
};

// Admin: delete a category (only if no expenses are using it).
categoryCtrl.adminDeleteCategory = (req, res) => {
  const { id } = req.params;
  db.query("SELECT COUNT(*) AS cnt FROM expenses WHERE category_id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error." });
    if (rows[0].cnt > 0) return res.status(400).json({ error: `Cannot delete — ${rows[0].cnt} expense(s) use this category.` });
    db.query("DELETE FROM categories WHERE id = ?", [id], (err2, result) => {
      if (err2) return res.status(500).json({ error: "DB error." });
      if (result.affectedRows === 0) return res.status(404).json({ error: "Category not found." });
      res.json({ message: "Category deleted." });
    });
  });
};

export default categoryCtrl;
