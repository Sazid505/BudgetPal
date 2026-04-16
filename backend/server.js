import 'dotenv/config';
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import incomeRoutes from "./routes/income.routes.js";
import receiptRoutes from "./routes/receipt.routes.js";
import forecastRoutes from "./routes/forecast.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded receipt images as static files at /uploads/<filename>
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// User authentication Routes
app.use("/api/auth", authRoutes);
// Expense Related Routes
app.use("/api/expenses", expenseRoutes);
// Income Related Routes
app.use("/api/income", incomeRoutes);
// Receipt Routes
app.use("/api/receipts", receiptRoutes);
// Forecast Routes
app.use("/api/forecast", forecastRoutes);

app.listen(3000, () => console.log("Server running on port 3000"));