import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../models/db.js";
import { getStoredReceiptCount } from "../utils/receiptStats.js";

const authCtrl = {};

// In-memory signup lock flag — admin can disable new registrations without a DB change.
let signupLocked = false;

// Tracking Active Users for Admin Dashboard.
const ACTIVE_MINUTES = 15;
const activeMap = new Map();

function markActive(userId) {
  activeMap.set(userId, Date.now());
}

function removeActive(userId) {
  activeMap.delete(userId);
}

function getActiveCount() {
  const cutoff = Date.now() - ACTIVE_MINUTES * 60 * 1000;
  let count = 0;
  for (const [id, last] of activeMap) {
    if (last >= cutoff) count++;
    else activeMap.delete(id);
  }
  return count;
}

authCtrl.signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  // Block new signups if admin has locked registrations.
  if (signupLocked) return res.status(403).json({ error: "New registrations are currently disabled." });

  // Hash the password before storing it in the database.
  const hashed = await bcrypt.hash(password, 10);
  db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashed, role],
    (err) => {
      if (err) return res.status(500).json({ error: "User already exists" });
      res.status(200).json({ message: "User created" });
    }
  );
};

authCtrl.login = (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (results.length === 0) return res.status(400).json({ error: "User not found" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, role: user.role }, "secret123", { expiresIn: "1d" });
    markActive(user.id);

    res.json({
      message: "Logged in",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  });
};

authCtrl.signout = (req, res) => {
  removeActive(req.user.id);
  res.json({ message: "Signed out" });
};

authCtrl.requireSignin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, "secret123", (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.user = decoded;
    markActive(decoded.id);
    next();
  });
};

authCtrl.deleteAccount = (req, res) => {
  const userId = req.user.id;
  db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json({ message: "Account deleted" });
  });
};

authCtrl.requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
};

authCtrl.getAllUsers = (req, res) => {
  db.query("SELECT id, name, email, role FROM users", [], (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(results);
  });
};

// Admin: delete a user by id (cannot delete self).
authCtrl.deleteUser = (req, res) => {
  const userId = req.params.id;
  if (req.user.id === parseInt(userId, 10)) return res.status(400).json({ error: "Cannot delete yourself" });
  db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json({ message: "User deleted" });
  });
};

authCtrl.updateProfile = (req, res) => {
  const userId = req.user.id;
  const { name, email } = req.body;
  if (!name && !email) return res.status(400).json({ error: "Nothing to update" });

  const updates = [];
  const values = [];
  if (name) { updates.push("name = ?"); values.push(name.trim()); }
  if (email) { updates.push("email = ?"); values.push(email.trim()); }
  values.push(userId);

  db.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values, (err) => {
    if (err) return res.status(500).json({ error: "Email already in use or DB error" });
    db.query("SELECT id, name, email, role FROM users WHERE id = ?", [userId], (err2, rows) => {
      if (err2 || !rows.length) return res.json({ message: "Profile updated" });
      res.json({ message: "Profile updated", user: rows[0] });
    });
  });
};

authCtrl.changePassword = (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both passwords are required" });
  if (newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters" });

  db.query("SELECT password FROM users WHERE id = ?", [userId], async (err, rows) => {
    if (err || !rows.length) return res.status(500).json({ error: "DB error" });
    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) return res.status(400).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, userId], (err2) => {
      if (err2) return res.status(500).json({ error: "DB error" });
      res.json({ message: "Password changed successfully" });
    });
  });
};

// Admin: promote or demote any user's role (cannot change own role).
authCtrl.updateUserRole = (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const { role } = req.body;
  if (req.user.id === targetId) return res.status(400).json({ error: "You cannot change your own role." });
  if (!["admin", "user"].includes(role)) return res.status(400).json({ error: "Invalid role." });
  db.query("UPDATE users SET role = ? WHERE id = ?", [role, targetId], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "User not found." });
    res.json({ message: `User role updated to ${role}.` });
  });
};

// Admin: get the current signup lock state.
authCtrl.getSignupLock = (req, res) => {
  res.json({ locked: signupLocked });
};

// Admin: toggle the signup lock on or off.
authCtrl.setSignupLock = (req, res) => {
  const { locked } = req.body;
  if (typeof locked !== "boolean") return res.status(400).json({ error: "locked must be true or false." });
  signupLocked = locked;
  res.json({ locked: signupLocked, message: locked ? "Signups disabled." : "Signups enabled." });
};

authCtrl.getAdminStats = (req, res) => {
  const activeUsers = getActiveCount();
  db.query("SELECT COUNT(*) AS total FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    const totalUsers = Number(rows[0]?.total ?? 0);

    db.query("SELECT COUNT(*) AS total FROM expenses", [], (errExp, expRows) => {
      const totalExpenses = errExp ? 0 : Number(expRows[0]?.total ?? 0);
      res.json({
        totalUsers,
        activeUsers,
        totalReceipts: getStoredReceiptCount(),
        totalExpenses
      });
    });
  });
};

export default authCtrl;
