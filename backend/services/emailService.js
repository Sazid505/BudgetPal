import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendBudgetAlert(to, categoryName, totalSpent, budgetLimit) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `BudgetPal: You've exceeded your ${categoryName} budget`,
      text: `Your total spend in ${categoryName} is ${totalSpent}. Your budget limit for this category is ${budgetLimit}. We suggest reducing spending in ${categoryName}.\n\nThe BudgetPal Team`
    });
  } catch (err) {
    console.error("sendBudgetAlert failed:", err);
  }
}

export async function sendAnomalyAlert(to, categoryName, newAmount, avgAmount) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `BudgetPal: Unusual expense detected in ${categoryName}`,
      text: `A new expense of ${newAmount} was recorded in ${categoryName}. This is more than 2x your recent average of ${avgAmount} for this category. Please review the expense to confirm it's correct.\n\nThe BudgetPal Team`
    });
  } catch (err) {
    console.error("sendAnomalyAlert failed:", err);
  }
}
