import db from "../models/db.js";

const emailChecker = (req, res, next) => {
  // Extracting the email from the frontend and storing it in a variable.
  const { email } = req.body;

  // Running a SQL Query to check if the email already exists in the database
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    // If there is an error of the database then it will return Database error
    if (err) return res.status(500).json({ error: "Database error" });
    // If the database query returns at least one row.
    if (results.length > 0) {
      // It means the email already exists in the database so it returns an error message Email already exists.
      return res.status(400).json({ error: "Email already exists" });
    }

    next();
  });
};

export default emailChecker;