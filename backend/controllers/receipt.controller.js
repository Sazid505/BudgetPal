import path from "path";
import fs from "fs";
import db from "../models/db.js";
import { runPython, parseJsonFromStdout } from "../utils/python.js";

// Ensure the receipts table exists
db.query(`
  CREATE TABLE IF NOT EXISTS receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    merchant VARCHAR(255),
    amount VARCHAR(50),
    date VARCHAR(50),
    category VARCHAR(100),
    raw_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, [], (err) => {
  if (err) console.error("Could not create receipts table:", err.message);
});

// GET /api/receipts — list all receipts for the logged-in user
export const getReceipts = (req, res) => {
  const userId = req.user.id;
  db.query(
    "SELECT * FROM receipts WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows || []);
    }
  );
};

// POST /api/receipts/extract — upload, OCR, save metadata, return result
export const extractText = (req, res) => {
  if (!req.file?.path) return res.status(400).json({ error: "No receipt image uploaded." });

  const imagePath = path.resolve(req.file.path);
  const savedFilename = path.basename(imagePath);
  const scriptDir = process.cwd();
  const code = [
    "import sys, json",
    "sys.path.insert(0, " + JSON.stringify(scriptDir) + ")",
    "from TextExtraction import extract_text_from_image",
    "print(json.dumps(extract_text_from_image(sys.argv[1])))"
  ].join("; ");

  runPython(["-c", code, imagePath], { cwd: scriptDir })
    .then(({ stdout, stderr }) => {
      try {
        const data = parseJsonFromStdout(stdout);
        if (data.error) return res.status(422).json({ error: data.error });

        const result = {
          merchant: data.merchant || "",
          amount: data.amount || "",
          date: data.date || "",
          raw_text: data.raw_text || "",
          filename: savedFilename
        };

        const userId = req.user?.id;
        if (userId) {
          db.query(
            "INSERT INTO receipts (user_id, filename, merchant, amount, date, raw_text) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, savedFilename, result.merchant, result.amount, result.date, result.raw_text],
            (err, insertResult) => {
              if (err) console.error("Failed to save receipt to DB:", err.message);
              res.json({ ...result, id: insertResult?.insertId });
            }
          );
        } else {
          res.json(result);
        }
      } catch (_) {
        res.status(422).json({ error: stderr.trim() || stdout.trim() || "Extraction failed." });
      }
    })
    .catch(() => {
      res.status(500).json({ error: "Could not run Python. Is Python installed?" });
    });
};

// DELETE /api/receipts/:id — delete receipt from DB and disk
export const deleteReceipt = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  db.query("SELECT filename, merchant, amount, date FROM receipts WHERE id = ? AND user_id = ?", [id, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Receipt not found" });

    const { filename, merchant, amount, date } = rows[0];

    // Delete receipt from DB
    db.query("DELETE FROM receipts WHERE id = ? AND user_id = ?", [id, userId], (err2) => {
      if (err2) return res.status(500).json({ error: "DB error" });

      // Delete image file from disk
      if (filename) {
        const filePath = path.join(process.cwd(), "uploads", filename);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (_) {}
        }
      }

      // Delete linked expense — try description+amount match first, then amount-only fallback
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        // Try matching by description (merchant) AND amount
        db.query(
          "DELETE FROM expenses WHERE user_id = ? AND ABS(CAST(amount AS DECIMAL(10,2)) - ?) < 0.01 AND description = ?",
          [userId, numAmount, merchant],
          (err3, result3) => {
            // If no rows deleted, fallback: delete by amount + date only
            if (!result3 || result3.affectedRows === 0) {
              const datePrefix = (date || "").slice(0, 10);
              db.query(
                "DELETE FROM expenses WHERE user_id = ? AND ABS(CAST(amount AS DECIMAL(10,2)) - ?) < 0.01 AND DATE(date) = ?",
                [userId, numAmount, datePrefix],
                (err4) => {
                  if (err4) console.error("Fallback expense delete failed:", err4.message);
                }
              );
            }
          }
        );
      }

      res.json({ message: "Receipt deleted" });
    });
  });
};

// GET /api/receipts/all — Admin: get ALL receipts from all users
export const getAllReceipts = (req, res) => {
  db.query(
    `SELECT r.id, r.filename, r.merchant, r.amount, r.date, r.category,
            r.created_at AS uploaded_at,
            u.name AS user_name, u.email AS user_email
     FROM receipts r
     JOIN users u ON r.user_id = u.id
     ORDER BY r.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(results);
    }
  );
};

// PATCH /api/receipts/:id/category — update category after ML prediction
export const updateReceiptCategory = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { category } = req.body;
  db.query(
    "UPDATE receipts SET category = ? WHERE id = ? AND user_id = ?",
    [category || "Other", id, userId],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ message: "Category updated" });
    }
  );
};
