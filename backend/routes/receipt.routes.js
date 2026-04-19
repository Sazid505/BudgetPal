import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authCtrl from "../controllers/auth.controller.js";
import { extractText, getReceipts, getAllReceipts, updateReceiptCategory, deleteReceipt } from "../controllers/receipt.controller.js";

const router = express.Router();

// Creating a Uploads folder if it does not exist
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `receipt_${Date.now()}${path.extname(file.originalname) || ".jpg"}`)
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/receipts/all — Admin: all receipts from all users
router.get("/all", authCtrl.requireSignin, authCtrl.requireAdmin, getAllReceipts);

// GET  /api/receipts         — list all receipts for logged-in user
router.get("/", authCtrl.requireSignin, getReceipts);

// POST /api/receipts/extract — upload & OCR a receipt
router.post("/extract", authCtrl.requireSignin, upload.fields([{ name: "receipt", maxCount: 1 }, { name: "file", maxCount: 1 }]), (req, res) => {
  req.file = req.files?.receipt?.[0] || req.files?.file?.[0];
  extractText(req, res);
});

// PATCH /api/receipts/:id/category — update category after ML prediction on frontend
router.patch("/:id/category", authCtrl.requireSignin, updateReceiptCategory);

// DELETE /api/receipts/:id — delete a receipt
router.delete("/:id", authCtrl.requireSignin, deleteReceipt);

export default router;
