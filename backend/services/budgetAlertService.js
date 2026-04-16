import db from "../models/db.js";
import { sendBudgetAlert, sendAnomalyAlert } from "./emailService.js";

function runQuery(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export default async function checkAndNotify(params) {
  const { userId, userEmail, categoryId, categoryName, newAmount, budgetLimit, expenseDate } = params;
  if (!userEmail) {
    console.warn("checkAndNotify: userEmail missing, skipping alerts");
    return;
  }
  if (!categoryId) return;
  try {
    const expenseDateVal = expenseDate || new Date().toISOString().split("T")[0];

    const anomalyRows = await runQuery(
      `SELECT COUNT(*) AS count, AVG(amount) AS avg_amount,
       COUNT(DISTINCT DATE_FORMAT(date, '%Y-%m')) AS distinct_months
       FROM expenses WHERE user_id = ? AND category_id = ?
       AND date >= DATE_SUB(?, INTERVAL 6 MONTH) AND date < ?`,
      [userId, categoryId, expenseDateVal, expenseDateVal]
    );
    const { count, avg_amount, distinct_months } = anomalyRows[0] || {};
    if (Number(count) >= 5 && Number(distinct_months) >= 2 && Number(newAmount) >= 2 * Number(avg_amount)) {
      await sendAnomalyAlert(userEmail, categoryName, newAmount, avg_amount);
    }

    if (budgetLimit != null) {
      const expenseMonth = expenseDateVal.substring(0, 7); // 'YYYY-MM'
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      if (expenseMonth !== currentMonth) {
        return; // Expense is not from the current calendar month — skip budget overage check
      }

      const totalRows = await runQuery(
        "SELECT SUM(amount) AS total_spent FROM expenses WHERE user_id = ? AND category_id = ?",
        [userId, categoryId]
      );
      const total_spent = Number(totalRows[0]?.total_spent ?? 0);

      let alertSent = 0;
      const alertRows = await runQuery(
        "SELECT alert_sent FROM user_budget_alerts WHERE user_id = ? AND category_id = ? AND `year_month` = ?",
        [userId, categoryId, expenseMonth]
      );
      if (alertRows[0]) alertSent = Number(alertRows[0].alert_sent);

      if (total_spent > Number(budgetLimit) && alertSent === 0) {
        await sendBudgetAlert(userEmail, categoryName, total_spent, budgetLimit);
        await runQuery(
          `INSERT INTO user_budget_alerts (user_id, category_id, \`year_month\`, alert_sent) VALUES (?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE alert_sent = 1`,
          [userId, categoryId, expenseMonth]
        );
      }
    }
  } catch (err) {
    console.error("checkAndNotify failed:", err);
  }
}