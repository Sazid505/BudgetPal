import db from "../models/db.js";

export function getCategoryId(name, type, callback) {
  const n = (name || "").trim();
  if (!n) return callback(null, null);
  db.query(
    "SELECT id FROM categories WHERE name = ? AND type = ? LIMIT 1",
    [n, type],
    (err, rows) => callback(err, rows?.[0]?.id ?? null)
  );
}
