# 💰 BudgetPal

A full-stack personal finance tracker with AI-powered expense categorization, OCR receipt scanning, ML spending forecasts, and a fully theme-aware dashboard — built with React, Node.js/Express, MySQL, and Python.

---

## ✨ Features

- **Smart Expense Tracking** — Add, edit, and delete expenses and income with category tagging
- **AI Categorization** — Two-stage classifier: keyword rules (200+ words) + scikit-learn ML model fallback
- **OCR Receipt Scanning** — Upload receipt photos; Tesseract + OpenCV extracts merchant, amount, and date automatically
- **Spending Forecasts** — Linear regression blended 60/40 with a trained model predicts the next 3 months of spending
- **Analytics Dashboard** — Category breakdowns, monthly trends, and spending tables with Recharts
- **Budget Allocation** — Set per-category percentage or fixed dollar limits with inline editing
- **Savings Tracker** — See this month's savings and total carried savings across all months
- **Dark / Light Mode** — Full theme system via CSS variables; toggle in Settings
- **Accessibility** — Font size scaling, high contrast mode, reduced motion, and enhanced focus ring
- **Admin Panel** — View all users, active session counts, and platform-wide stats

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), React Router, Recharts |
| Backend | Node.js, Express |
| Database | MySQL (`mysql2`) |
| Auth | JWT (1-day expiry, client-side expiry validation) |
| AI / ML | Python, scikit-learn, joblib |
| OCR | Python, Tesseract, OpenCV (`pytesseract`) |
| Styling | CSS custom properties (dark/light theme) |

---

## 📁 Project Structure

```
BudgetPal-main/
├── backend/
│   ├── controllers/
│   │   ├── auth.controller.js       # Signup, login, profile, password, admin stats
│   │   ├── expense.controller.js    # CRUD for expenses
│   │   ├── income.controller.js     # CRUD for income
│   │   ├── category.controller.js   # AI category prediction endpoint
│   │   ├── receipt.controller.js    # Receipt upload + OCR pipeline
│   │   └── forecast.controller.js   # ML forecast endpoint
│   ├── routes/                      # Express route files (auth, expense, income, receipt, forecast)
│   ├── middlewares/
│   │   └── emailChecker.js          # Pre-signup duplicate email check
│   ├── models/
│   │   └── db.js                    # MySQL connection
│   ├── utils/
│   │   ├── python.js                # Spawn Python subprocesses from Node
│   │   └── categoryLookup.js        # Resolve category name → DB id
│   ├── predict_category.py          # Two-stage expense categorizer (keywords + ML)
│   ├── forecast.py                  # Monthly spending forecaster (linear regression + model blend)
│   ├── TextExtraction.py            # Tesseract OCR for receipt images
│   ├── expense_model.pkl            # Trained scikit-learn classifier
│   ├── vectorizer.pkl               # Fitted TF-IDF vectorizer
│   ├── forecast_model.pkl           # Trained forecasting model
│   └── server.js                    # Express server entry point (port 3000)
│
└── finance-tracker/
    └── src/
        ├── main.jsx                 # Entry point — applies saved theme + accessibility before render
        ├── App.jsx                  # Central state (expenses, income, user) + all routes
        ├── App.css                  # Master stylesheet: CSS variables, dark/light themes, all components
        ├── index.css                # Receipt page, month navigator, base body styles
        ├── components/
        │   ├── NavBar.jsx           # Sticky navbar: logo + greeting + nav links
        │   └── ProgressBar.jsx      # Reusable theme-aware progress bar
        └── pages/
            ├── public/
            │   ├── Home.jsx         # Marketing landing page
            │   ├── Features.jsx     # 2-column feature card grid
            │   ├── About.jsx        # About page
            │   ├── Login.jsx        # JWT login form
            │   └── Signup.jsx       # Registration form
            ├── users/
            │   ├── Dashboard.jsx    # Main finance hub: budget, savings, add expense/income, recent table
            │   ├── Expenses.jsx     # Full expense + income table with inline editing
            │   ├── Analytics.jsx    # Theme-aware charts: category trends, breakdowns, monthly table
            │   ├── Forecast.jsx     # ML forecast: 3-month predictions + actual vs predicted chart
            │   ├── Receipts.jsx     # Receipt gallery with search, filter, and detail modal
            │   └── Settings.jsx     # Appearance, profile, password, preferences, accessibility, danger zone
            └── admin/
                ├── AdminDashboard.jsx  # Platform stats: users, active sessions, receipts, expenses
                └── Users.jsx           # User management table with role badges + delete
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MySQL](https://www.mysql.com/) running locally
- [Python](https://www.python.org/) 3.8+
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) installed and on PATH

### 1. Clone the repo

```bash
git clone https://github.com/Sazid505/BudgetPal.git
cd BudgetPal
```

### 2. Set up the database

```sql
CREATE DATABASE budgetpal;
```

Then import your schema (tables: `users`, `expenses`, `income`, `categories`, `receipts`).

### 3. Configure the backend

Create a `.env` file in `/backend`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=budgetpal
JWT_SECRET=your_jwt_secret
```

Install dependencies and start the server:

```bash
cd backend
npm install
node server.js
```

### 4. Install Python dependencies

```bash
pip install scikit-learn joblib pytesseract opencv-python numpy
```

### 5. Start the frontend

```bash
cd finance-tracker
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🤖 AI Features

### Expense Categorization

Descriptions are classified in two stages:
1. **Keyword rules** — 200+ keywords across 10 categories (Food, Transportation, Healthcare, Housing, Entertainment, Shopping, Personal, Education, Debt Payments, Miscellaneous)
2. **ML fallback** — scikit-learn model using a TF-IDF vectorizer trained on a synthetic personal finance dataset

### Spending Forecast

Historical monthly totals are piped from the database to `forecast.py`, which blends a personal linear regression trend (60%) with a pre-trained model (40%) to predict the next 3 months — both total and per-category.

### Receipt OCR

Uploaded receipt images are preprocessed with OpenCV (grayscale, threshold, denoise) before being passed to Tesseract. Regex patterns then extract the merchant name, total amount, and date from the raw OCR text.

---

## 🎨 Theming & Accessibility

BudgetPal supports full dark and light modes via CSS custom properties. The theme is applied before React renders to prevent any flash.

Accessibility settings (saved to `localStorage`):

| Setting | Implementation |
|---|---|
| Font size (Large / Extra Large) | `document.documentElement.style.fontSize` |
| High contrast | `body.a11y-contrast` CSS class |
| Reduced motion | Injected `<style>` tag disabling animations |
| Enhanced focus ring | `body.a11y-focus` CSS class |

---

## 📸 Pages at a Glance

| Page | Description |
|---|---|
| **Dashboard** | Monthly overview, savings tracker, budget allocation, add expense/income |
| **Expenses** | Full editable table of all expenses and income |
| **Analytics** | Category trends, breakdowns, and monthly spending matrix |
| **Forecast** | 3-month ML predictions with actual vs forecast chart |
| **Receipts** | Upload and manage receipt scans with OCR extraction |
| **Settings** | Theme, profile, password, preferences, and accessibility |

---

## 📄 License

This project is for personal/educational use. Feel free to fork and adapt.

---

> Built by Md.Sazid, Rohan Talpur, Krishna Kumar Mahato & Maaz Bobat
