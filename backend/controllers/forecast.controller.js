import db from "../models/db.js";
import { runPython, parseJsonFromStdout } from "../utils/python.js";
import path from "path";

const scriptDir = process.cwd();
const scriptPath = path.join(scriptDir, "forecast.py");

function runQuery(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// GET /api/forecast/total — predict next 3 months total spending
export const forecastTotal = async (req, res) => {
  const userId = req.user.id;
  try {
    const rows = await runQuery(
      `SELECT DATE_FORMAT(date, '%Y-%m') AS month, SUM(amount) AS total
       FROM expenses
       WHERE user_id = ? AND date IS NOT NULL
       GROUP BY month
       ORDER BY month ASC`,
      [userId]
    );

    if (!rows || rows.length < 2) {
      return res.json({
        forecast: [],
        historical: [],
        warning: "Not enough data. Add at least 2 months of expenses to see a forecast."
      });
    }

    const input = rows.map((r) => ({
      month: r.month,
      total: parseFloat(r.total)
    }));

    const { stdout, stderr } = await runPython(
      [scriptPath, "total"],
      { cwd: scriptDir, stdin: JSON.stringify(input) }
    );

    const data = parseJsonFromStdout(stdout);
    if (data.error) return res.status(422).json({ error: data.error });
    res.json(data);
  } catch (err) {
    console.error("forecastTotal error:", err);
    res.status(500).json({ error: "Forecast failed." });
  }
};

// GET /api/forecast/category — predict next 3 months per category
export const forecastCategory = async (req, res) => {
  const userId = req.user.id;
  try {
    const rows = await runQuery(
      `SELECT DATE_FORMAT(e.date, '%Y-%m') AS month,
              c.name AS category,
              SUM(e.amount) AS total
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? AND e.date IS NOT NULL
       GROUP BY month, category
       ORDER BY month ASC`,
      [userId]
    );

    if (!rows || rows.length < 2) {
      return res.json({
        forecast: {},
        warning: "Not enough data. Add at least 2 months of expenses to see a forecast."
      });
    }

    const input = rows.map((r) => ({
      month: r.month,
      category: r.category || "Other",
      total: parseFloat(r.total)
    }));

    const { stdout } = await runPython(
      [scriptPath, "category"],
      { cwd: scriptDir, stdin: JSON.stringify(input) }
    );

    const data = parseJsonFromStdout(stdout);
    if (data.error) return res.status(422).json({ error: data.error });
    res.json(data);
  } catch (err) {
    console.error("forecastCategory error:", err);
    res.status(500).json({ error: "Category forecast failed." });
  }
};
