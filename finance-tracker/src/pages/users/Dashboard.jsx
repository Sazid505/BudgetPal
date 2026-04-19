import { useState, useEffect, useRef, useCallback } from "react";
import ProgressBar from "../../components/ProgressBar";
import { api, getToken } from "../../utils/api";
import { formatDate, getTodayLocal } from "../../utils/format";
import { addReceiptToHistory } from "./Receipts";

const PREDICT_TEXT_MAX = 6000;

// ── Standalone Category Manager component ──────────────────────────────────
function CategoryManager() {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [newName,     setNewName]     = useState("");
  const [newType,     setNewType]     = useState("expense");
  const [editingCat,  setEditingCat]  = useState(null); // { id, name }
  const [msg,         setMsg]         = useState(null); // { type, text }
  const [open,        setOpen]        = useState(false); // collapsed by default
  const msgTimer = useRef(null);
  const wrapperRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const showMsg = (type, text) => {
    clearTimeout(msgTimer.current);
    setMsg({ type, text });
    msgTimer.current = setTimeout(() => setMsg(null), 4000);
  };

  useEffect(() => {
    if (!open) return; // only load when panel is expanded
    fetch("/api/expenses/categories/all", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setCategories(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [open]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return showMsg("error", "Category name cannot be empty.");
    try {
      const res = await fetch("/api/expenses/categories/all", {
        method: "POST", headers, body: JSON.stringify({ name: newName.trim(), type: newType })
      });
      const data = await res.json();
      if (!res.ok) return showMsg("error", data.error || "Failed to add.");
      setCategories((p) => [...p, data]);
      setNewName("");
      showMsg("success", `"${data.name}" added.`);
    } catch { showMsg("error", "Network error."); }
  };

  const handleRename = async (id) => {
    if (!editingCat?.name?.trim()) return;
    try {
      const res = await fetch(`/api/expenses/categories/all/${id}`, {
        method: "PUT", headers, body: JSON.stringify({ name: editingCat.name.trim() })
      });
      const data = await res.json();
      if (!res.ok) return showMsg("error", data.error || "Failed to rename.");
      setCategories((p) => p.map((c) => c.id === id ? { ...c, name: editingCat.name.trim() } : c));
      setEditingCat(null);
      showMsg("success", "Category renamed.");
    } catch { showMsg("error", "Network error."); }
  };

  const handleDelete = async (id, name, count) => {
    if (count > 0) return showMsg("error", `Cannot delete "${name}" — ${count} expense(s) use it.`);
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/expenses/categories/all/${id}`, { method: "DELETE", headers });
      const data = await res.json();
      if (!res.ok) return showMsg("error", data.error || "Failed to delete.");
      setCategories((p) => p.filter((c) => c.id !== id));
      showMsg("success", `"${name}" deleted.`);
    } catch { showMsg("error", "Network error."); }
  };

  return (
    <div className="cat-manager-card" ref={wrapperRef}>
      {/* ── Header — click to expand/collapse ── */}
      <button className="cat-manager-toggle" onClick={() => setOpen((p) => !p)}>
        <span className="cat-manager-title">🏷️ Manage Categories</span>
        <span className="cat-manager-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="cat-manager-body">
          <p className="cat-manager-desc">
            Add, rename, or delete expense and income categories. Categories with existing expenses cannot be deleted.
          </p>

          {/* ── Message ── */}
          {msg && <div className={`cat-manager-msg ${msg.type}`}>{msg.text}</div>}

          {/* ── Add form ── */}
          <form className="cat-manager-add-form" onSubmit={handleAdd}>
            <input
              className="cat-manager-input"
              type="text"
              placeholder="New category name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <select
              className="cat-manager-select"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <button type="submit" className="cat-manager-add-btn">Add</button>
          </form>

          {/* ── Category lists ── */}
          {loading ? (
            <p className="cat-manager-empty">Loading…</p>
          ) : (
            ["expense", "income"].map((type) => {
              const group = categories.filter((c) => c.type === type);
              return (
                <div key={type} className="cat-manager-group">
                  <span className="cat-manager-group-label">
                    {type === "expense" ? "💸 Expense" : "💰 Income"}
                    <span className="cat-manager-group-count">{group.length}</span>
                  </span>
                  <div className="cat-manager-list">
                    {group.map((cat) => (
                      <div key={cat.id} className="cat-manager-row">
                        {editingCat?.id === cat.id ? (
                          <>
                            <input
                              className="cat-manager-edit-input"
                              value={editingCat.name}
                              onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename(cat.id);
                                if (e.key === "Escape") setEditingCat(null);
                              }}
                              autoFocus
                            />
                            <button className="cat-btn save"   onClick={() => handleRename(cat.id)}>✓</button>
                            <button className="cat-btn cancel" onClick={() => setEditingCat(null)}>✕</button>
                          </>
                        ) : (
                          <>
                            <span className="cat-manager-name">{cat.name}</span>
                            <span className="cat-manager-uses">{cat.expense_count} uses</span>
                            <button className="cat-btn edit"   onClick={() => setEditingCat({ id: cat.id, name: cat.name })}>✏️</button>
                            <button
                              className="cat-btn delete"
                              onClick={() => handleDelete(cat.id, cat.name, cat.expense_count)}
                              disabled={cat.expense_count > 0}
                              title={cat.expense_count > 0 ? "In use — cannot delete" : "Delete"}
                            >🗑️</button>
                          </>
                        )}
                      </div>
                    ))}
                    {group.length === 0 && <p className="cat-manager-empty">No {type} categories yet.</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const BUDGET_CATEGORIES = [
  "Food", "Transportation", "Healthcare", "Miscellaneous", "Housing",
  "Entertainment", "Shopping", "Personal", "Debt Payments", "Education",
];

const DEFAULT_CATEGORY_PERCENTAGES = {
  Food: 20, Transportation: 10, Healthcare: 10, Miscellaneous: 5,
  Housing: 20, Entertainment: 5, Shopping: 7, Personal: 5,
  "Debt Payments": 3, Education: 0,
};

const getTotalAllocation = (pct) =>
  BUDGET_CATEGORIES.reduce((s, c) => s + Number(pct?.[c] || 0), 0);

const sanitizeCategoryPercentages = (loaded) => {
  const s = {};
  BUDGET_CATEGORIES.forEach((c) => {
    const v = Number(loaded?.[c]);
    s[c] = Number.isFinite(v) ? v : DEFAULT_CATEGORY_PERCENTAGES[c];
  });
  return s;
};

/* ── tiny inline feedback helper ── */
const Msg = ({ type, text }) => {
  if (!text) return null;
  const isSuccess = type === "success";
  return (
    <div className={`dash-msg dash-msg-${isSuccess ? "success" : "error"}`}>
      <span className="dash-msg-icon">{isSuccess ? "✓" : "✕"}</span>
      {text}
    </div>
  );
};

/* ── auto-clear hook ── */
function useMsg(initial = "") {
  const [msg, setMsg] = useState(initial);
  const timer = useRef(null);
  const show = useCallback((text, duration = 4000) => {
    setMsg(text);
    clearTimeout(timer.current);
    if (text) timer.current = setTimeout(() => setMsg(""), duration);
  }, []);
  return [msg, show];
}

const Dashboard = ({ addExpense, addIncome, income = [], expenses = [], refreshExpenses }) => {
  /* ── form state ── */
  const [description, setDescription]   = useState("");
  const [amount,      setAmount]         = useState("");
  const [date,        setDate]           = useState("");
  const [manualCategory, setManualCategory] = useState("auto"); // "auto" = AI prediction
  const [incomeAmount, setIncomeAmount]  = useState("");
  const [source,       setSource]        = useState("");
  const [incomeDate,   setIncomeDate]    = useState("");

  /* ── savings goal ── */
  const [savingsGoal,       setSavingsGoal]       = useState(150);
  const [editingSavingsGoal, setEditingSavingsGoal] = useState(false);
  const [savingsGoalInput,  setSavingsGoalInput]  = useState("150");

  /* ── budget allocation ── */
  const [categoryPercentages, setCategoryPercentages] = useState(DEFAULT_CATEGORY_PERCENTAGES);
  const [editingPercentageInput, setEditingPercentageInput] = useState("");
  const [categoryLimits, setCategoryLimits] = useState(() => {
    try { return JSON.parse(localStorage.getItem("categoryLimits") || "{}"); }
    catch { return {}; }
  });
  const [editingLimitCat,   setEditingLimitCat]   = useState(null);
  const [editingLimitInput, setEditingLimitInput] = useState("");

  /* ── receipt ── */
  const receiptInputRef = useRef(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  /* ── per-form messages (success / error) ── */
  const [expenseSuccess, showExpenseSuccess] = useMsg();
  const [expenseError,   showExpenseError]   = useMsg();
  const [incomeSuccess,  showIncomeSuccess]  = useMsg();
  const [incomeError,    showIncomeError]    = useMsg();
  const [receiptSuccess, showReceiptSuccess] = useMsg();
  const [receiptError,   showReceiptError]   = useMsg();
  const [savingsSuccess, showSavingsSuccess] = useMsg();
  const [savingsError,   showSavingsError]   = useMsg();
  const [budgetSuccess,  showBudgetSuccess]  = useMsg();
  const [budgetError,    showBudgetError]    = useMsg();

  /* ── month selector ── */
  const [selectedMonthKey, setSelectedMonthKey] = useState(getTodayLocal().slice(0, 7));

  const goToPrevMonth = () => {
    const [y, m] = selectedMonthKey.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setSelectedMonthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const goToNextMonth = () => {
    const [y, m] = selectedMonthKey.split("-").map(Number);
    const d = new Date(y, m, 1);
    setSelectedMonthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const isCurrentMonth  = selectedMonthKey === getTodayLocal().slice(0, 7);
  const selectedMonthLabel = (() => {
    const [y, m] = selectedMonthKey.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
  })();

  /* ── calculations ── */
  const calculateTotalIncome = () =>
    income.filter((i) => String(i.date || "").trim().slice(0, 7) === selectedMonthKey)
          .reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const expensesThisMonth = expenses.filter(
    (e) => String(e.date || "").trim().slice(0, 7) === selectedMonthKey
  );

  const calculateExpensesByCategory = (cat) =>
    expensesThisMonth
      .filter((e) => e.category && e.category.toLowerCase() === cat.toLowerCase())
      .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const calculateTotalExpenses = () =>
    expensesThisMonth.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const calculateNetBalance = () => calculateTotalIncome() - calculateTotalExpenses();

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const getCategoryBudget = (cat) => {
    if (categoryLimits[cat] != null) return Number(categoryLimits[cat]);
    return calculateTotalIncome() * ((categoryPercentages[cat] || 0) / 100);
  };
  const getRemaining        = (cat) => getCategoryBudget(cat) - calculateExpensesByCategory(cat);
  const getProgressPercentage = (cat) =>
    Math.min((calculateExpensesByCategory(cat) / (getCategoryBudget(cat) || 1)) * 100, 100);

  /* ── validation helpers ── */
  const validateAmount = (val, label, context = "expense") => {
    const num = parseFloat(val);
    if (!String(val).trim() || isNaN(num)) return `Please enter a valid ${label}.`;
    if (num <= 0) return `${label.charAt(0).toUpperCase() + label.slice(1)} must be greater than zero.`;
    if (num < 0)  return `${label.charAt(0).toUpperCase() + label.slice(1)} cannot be negative.`;
    if (num > 10_000_000) return `That amount looks unrealistically large. Please double-check.`;

    if (context === "expense") {
      const monthlyIncome = calculateTotalIncome();
      if (monthlyIncome > 0 && num > monthlyIncome) {
        return `$${formatCurrency(num)} exceeds your total income for ${selectedMonthLabel} ($${formatCurrency(monthlyIncome)}).`;
      }
    }
    return null; // valid
  };

  /* ── load saved prefs ── */
  useEffect(() => {
    const saved = localStorage.getItem("savingsGoal");
    if (saved) { const g = parseFloat(saved); setSavingsGoal(g); setSavingsGoalInput(String(g)); }

    const sp = localStorage.getItem("categoryPercentages");
    if (sp) {
      try {
        const parsed    = JSON.parse(sp);
        const sanitized = sanitizeCategoryPercentages(parsed);
        const total     = getTotalAllocation(sanitized);
        if (total > 100) {
          setCategoryPercentages(DEFAULT_CATEGORY_PERCENTAGES);
          localStorage.setItem("categoryPercentages", JSON.stringify(DEFAULT_CATEGORY_PERCENTAGES));
        } else {
          setCategoryPercentages(sanitized);
        }
      } catch {
        setCategoryPercentages(DEFAULT_CATEGORY_PERCENTAGES);
        localStorage.setItem("categoryPercentages", JSON.stringify(DEFAULT_CATEGORY_PERCENTAGES));
      }
    } else {
      setCategoryPercentages(DEFAULT_CATEGORY_PERCENTAGES);
      localStorage.setItem("categoryPercentages", JSON.stringify(DEFAULT_CATEGORY_PERCENTAGES));
    }
  }, []);

  /* ── AI category prediction ── */
  const fetchPredictedCategory = async (text) => {
    const trimmed = String(text || "").trim().slice(0, PREDICT_TEXT_MAX);
    if (!trimmed) return "Other";
    try {
      const res  = await api("/api/expenses/predict-category", { method: "POST", body: JSON.stringify({ description: trimmed }) });
      const data = await res.json().catch(() => ({}));
      const cat  = data.category;
      return typeof cat === "string" && cat.trim() ? cat.trim() : "Other";
    } catch { return "Other"; }
  };

  /* ── expense submit ── */
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    showExpenseError("");
    showExpenseSuccess("");

    if (!description.trim()) { showExpenseError("Description is required."); return; }
    const amtErr = validateAmount(amount, "amount", "expense");
    if (amtErr) { showExpenseError(amtErr); return; }

    setExpenseSubmitting(true);
    try {
      // Use manual category if chosen, otherwise call AI
      const category = manualCategory === "auto"
        ? await fetchPredictedCategory(description)
        : manualCategory;

      addExpense({ description, amount, category, date });
      setDescription(""); setAmount(""); setDate("");
      // Keep category so user doesn't have to re-select on next entry
      const label = manualCategory === "auto" ? `AI: "${category}"` : category;
      showExpenseSuccess(`Expense added! Category: ${label}.`);
      setTimeout(() => refreshExpenses?.(), 500);
    } catch {
      showExpenseError("Something went wrong. Please try again.");
    } finally {
      setExpenseSubmitting(false);
    }
  };

  /* ── income submit ── */
  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    showIncomeError("");
    showIncomeSuccess("");

    const amtErr = validateAmount(incomeAmount, "amount", "income");
    if (amtErr) { showIncomeError(amtErr); return; }

    addIncome({ amount: incomeAmount, source, date: incomeDate });
    setIncomeAmount(""); setSource(""); setIncomeDate("");
    showIncomeSuccess("Income recorded successfully!");
    setTimeout(() => refreshExpenses?.(), 500);
  };

  /* ── savings goal ── */
  const handleSavingsGoalSubmit = (e) => {
    if (e) e.stopPropagation();
    showSavingsError("");
    showSavingsSuccess("");

    const goal = parseFloat(savingsGoalInput);
    if (isNaN(goal) || goal < 0) { showSavingsError("Please enter a valid positive amount."); return; }
    if (goal > 10_000_000)       { showSavingsError("Savings goal seems unrealistically large."); return; }

    const income = calculateTotalIncome();
    if (income > 0 && goal > income * 12) {
      showSavingsError(`$${formatCurrency(goal)} exceeds 12× your monthly income. Please check.`);
      return;
    }

    setSavingsGoal(goal);
    setSavingsGoalInput(String(goal));
    setEditingSavingsGoal(false);
    localStorage.setItem("savingsGoal", String(goal));
    showSavingsSuccess("Savings goal updated!");
  };

  /* ── budget allocation save ── */
  const openEditBudget = (cat) => {
    setEditingLimitCat(cat);
    setEditingPercentageInput(String(categoryPercentages[cat] ?? 0));
    setEditingLimitInput(categoryLimits[cat] != null ? String(categoryLimits[cat]) : "");
    showBudgetError(""); showBudgetSuccess("");
  };

  const handleSaveBudget = (cat) => {
    showBudgetError(""); showBudgetSuccess("");

    // Validate percentage
    const newPct = parseFloat(editingPercentageInput);
    if (isNaN(newPct) || newPct < 0 || newPct > 100) {
      showBudgetError("Allocation % must be between 0 and 100.");
      return;
    }
    const updatedPct = { ...categoryPercentages, [cat]: newPct };
    const total = BUDGET_CATEGORIES.reduce((s, k) => s + (updatedPct[k] || 0), 0);
    if (total > 100) {
      showBudgetError(`Total allocation would be ${total.toFixed(1)}% — over 100%. Please reduce.`);
      return;
    }

    // Validate fixed limit
    const limitVal = editingLimitInput.trim();
    if (limitVal !== "") {
      const parsed = parseFloat(limitVal);
      if (isNaN(parsed) || parsed < 0) { showBudgetError("Fixed limit must be a positive number."); return; }
      if (parsed > 10_000_000)          { showBudgetError("That limit looks unrealistically large."); return; }
    }

    // Persist percentages
    const cleaned = {};
    BUDGET_CATEGORIES.forEach((c) => { cleaned[c] = updatedPct[c] ?? 0; });
    setCategoryPercentages(cleaned);
    localStorage.setItem("categoryPercentages", JSON.stringify(cleaned));

    // Persist fixed limit
    const newLimits = { ...categoryLimits };
    if (limitVal === "") { delete newLimits[cat]; }
    else { newLimits[cat] = parseFloat(limitVal); }
    setCategoryLimits(newLimits);
    localStorage.setItem("categoryLimits", JSON.stringify(newLimits));

    setEditingLimitCat(null);
    setEditingLimitInput("");
    setEditingPercentageInput("");
    showBudgetSuccess(`${cat} budget saved!`);
  };

  /* ── receipt upload ── */
  const normalizeReceiptDate = (dateStr) => {
    if (!dateStr?.trim()) return getTodayLocal();
    const s = dateStr.trim();
    const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (m) {
      const [, a, b, y] = m;
      const year  = y.length === 2 ? (parseInt(y, 10) <= 50 ? 2000 + parseInt(y, 10) : 1900 + parseInt(y, 10)) : parseInt(y, 10);
      const month = parseInt(a, 10), day = parseInt(b, 10);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31)
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;
    return getTodayLocal();
  };

  const isReasonableAmount = (val) => {
    const num = parseFloat(val);
    if (num < 0.01 || num > 9999.99 || isNaN(num)) return false;
    if (/^\d+\.\d{2}$/.test(String(val).trim())) return true;
    if (Number.isInteger(num) && num < 1000) return true;
    return false;
  };

  const parseReceiptFromRawText = (rawText) => {
    const text  = rawText || "";
    const today = getTodayLocal();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const desc  = lines[0] && lines[0].length <= 80 ? lines[0] : "Receipt";

    const labelRx = /(?:total|amount|sum|balance|fare)\s*[:\s]*\$?\s*(\d+(?:[.,]\d{1,2})?)/gi;
    let amt = "", m;
    while ((m = labelRx.exec(text)) !== null) {
      const val = m[1].replace(",", ".");
      if (isReasonableAmount(val)) { amt = val; break; }
    }
    if (!amt) {
      const dm = text.match(/\$\s*(\d+[.,]\d{2})\b/);
      if (dm && isReasonableAmount(dm[1].replace(",", "."))) amt = dm[1].replace(",", ".");
    }
    if (!amt) {
      const dm = text.match(/\b(\d+[.,]\d{2})\b/);
      if (dm && isReasonableAmount(dm[1].replace(",", "."))) amt = dm[1].replace(",", ".");
    }
    const dateRx = /\b(\d{4})[-./](\d{1,2})[-./](\d{1,2})\b|\b(\d{1,2})[-./](\d{1,2})[-./](\d{4})\b/;
    const dm2 = text.match(dateRx);
    let dStr = today;
    if (dm2) {
      const g = dm2[0].split(/[-./]/);
      dStr = g[0].length === 4
        ? `${g[0]}-${g[1].padStart(2, "0")}-${g[2].padStart(2, "0")}`
        : `${g[2]}-${g[0].padStart(2, "0")}-${g[1].padStart(2, "0")}`;
    }
    return { description: desc, amount: amt || "", date: dStr };
  };

  const handleReceiptUpload = async (event) => {
    const file = event.target?.files?.[0];
    event.target.value = "";
    if (!file) return;
    showReceiptError(""); showReceiptSuccess("");
    setReceiptLoading(true);

    try {
      const formData = new FormData();
      formData.append("receipt", file);
      const token    = localStorage.getItem("token");
      const response = await fetch("/api/receipts/extract", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { showReceiptError(data.error || "Upload failed. Please try again."); return; }

      const useBackend = data.amount && isReasonableAmount(data.amount) && (data.merchant || data.raw_text?.length > 10);
      let description, amount, date;

      if (useBackend) {
        description = data.merchant || "Receipt";
        amount = data.amount;
        date   = normalizeReceiptDate(data.date);
      } else if (data.raw_text?.trim().length > 5) {
        const parsed = parseReceiptFromRawText(data.raw_text);
        description  = parsed.description;
        amount       = parsed.amount;
        date         = parsed.date;
      } else {
        showReceiptError("Could not read the receipt. Try a clearer photo.");
        return;
      }

      if (!amount) { showReceiptError("No amount detected. Please add the expense manually."); return; }

      // Validate amount against income
      const receiptAmt = parseFloat(amount);
      const monthlyInc = calculateTotalIncome();
      if (receiptAmt <= 0) { showReceiptError("Invalid amount detected on receipt."); return; }
      if (receiptAmt > 10_000_000) { showReceiptError("Detected amount looks unrealistically large. Please add manually."); return; }
      if (monthlyInc > 0 && receiptAmt > monthlyInc) {
        showReceiptError(`Detected amount ($${formatCurrency(receiptAmt)}) exceeds your income for ${selectedMonthLabel} ($${formatCurrency(monthlyInc)}). Please verify.`);
        return;
      }

      const textForModel = [description, data.raw_text].filter((s) => s?.trim()).join("\n").slice(0, PREDICT_TEXT_MAX);
      const category     = await fetchPredictedCategory(textForModel);

      if (BUDGET_CATEGORIES.includes(category)) {
        const remaining = getRemaining(category);
        if (remaining < receiptAmt) {
          showReceiptError(`Would exceed your ${category} budget. Remaining: $${formatCurrency(remaining)}.`);
          return;
        }
      }

      addExpense({ description, amount, category, date });
      showReceiptSuccess(`Receipt processed! Added as "${description}" under ${category}.`);
      setTimeout(() => refreshExpenses?.(), 500);

      if (data.id && getToken()) {
        api(`/api/receipts/${data.id}/category`, { method: "PATCH", body: JSON.stringify({ category }) }).catch(() => {});
      }

      const reader = new FileReader();
      const save   = (img) => addReceiptToHistory({ id: Date.now(), filename: data.filename || "", merchant: description, amount, category, date, raw_text: data.raw_text || "", imageDataUrl: img || null, addedAt: new Date().toISOString() });
      reader.onload = (ev) => save(ev.target?.result);
      reader.onerror = () => save(null);
      reader.readAsDataURL(file);

    } catch {
      showReceiptSuccess("Receipt likely saved. Refreshing…");
      setTimeout(() => refreshExpenses?.(), 500);
    } finally {
      setReceiptLoading(false);
    }
  };

  /* ── savings calculations ── */
  // This month: income minus expenses for the currently viewed month
  const calculateThisMonthSavings = () => calculateTotalIncome() - calculateTotalExpenses();

  // Total carried: cumulative all-time income minus all-time expenses
  const calculateTotalCarried = () => {
    const allIncome   = income.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const allExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    return allIncome - allExpenses;
  };

  const fmtSavings = (val) => `${val >= 0 ? "+" : "-"}$${formatCurrency(Math.abs(val))}`;

  /* ── recent expenses ── */
  const recentExpenses = (() => {
    const now = new Date(), cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return [...expenses]
      .filter((e) => {
        const d = new Date(String(e.date || "").trim());
        return !isNaN(d.getTime()) && d >= cutoff && d <= now;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  })();

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div style={{ padding: "1.5rem 2rem 0" }}>

      {/* Month Navigator */}
      <div className="month-navigator">
        <button className="month-nav-btn" onClick={goToPrevMonth}>&#8592;</button>
        <span className="month-nav-label">{selectedMonthLabel}</span>
        <button className="month-nav-btn" onClick={goToNextMonth} disabled={isCurrentMonth}>&#8594;</button>
        {!isCurrentMonth && (
          <button className="month-nav-today" onClick={() => setSelectedMonthKey(getTodayLocal().slice(0, 7))}>
            Back to Today
          </button>
        )}
      </div>

      <div className="dashboard-cards" style={{ paddingTop: "1rem" }}>

        {/* ── Savings Goal ── */}
        <div className="savings-goal-card" onClick={() => !editingSavingsGoal && setEditingSavingsGoal(true)}>
          {editingSavingsGoal ? (
            <div onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                value={savingsGoalInput}
                onChange={(e) => setSavingsGoalInput(e.target.value)}
                placeholder="Enter savings goal"
                step="0.01" min="0"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSavingsGoalSubmit(e)}
              />
              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                <button onClick={handleSavingsGoalSubmit}>Save</button>
                <button onClick={() => { setEditingSavingsGoal(false); showSavingsError(""); showSavingsSuccess(""); }}>Cancel</button>
              </div>
              <Msg type="error"   text={savingsError}   />
              <Msg type="success" text={savingsSuccess} />
            </div>
          ) : (
            <>
              <h2>${formatCurrency(savingsGoal)}</h2>
              <p>Savings Goal</p>
              <small style={{ cursor: "pointer", color: "var(--text-muted)" }}>Click to edit</small>
              <Msg type="success" text={savingsSuccess} />
            </>
          )}
        </div>

        {/* ── Net Balance ── */}
        <div className="net-balance-card">
          <h2>${formatCurrency(calculateNetBalance())}</h2>
          <p>Net Balance</p>
          <small style={{ color: "var(--text-muted)", fontSize: "0.85em" }}>{selectedMonthLabel}</small>
        </div>

        {/* ── Upload Receipt ── */}
        <div className="upload-card">
          <h2>Upload Receipt</h2>
          <input
            ref={receiptInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/bmp,image/tiff"
            style={{ display: "none" }}
            onChange={handleReceiptUpload}
          />
          <button type="button" onClick={() => receiptInputRef.current?.click()} disabled={receiptLoading}>
            {receiptLoading ? "Extracting…" : "Upload"}
          </button>
          <Msg type="error"   text={receiptError}   />
          <Msg type="success" text={receiptSuccess} />
        </div>

        {/* ── Budget Allocation ── */}
        <div className="remaining-card">
          <div className="budget-alloc-header">
            <h2>Budget Allocation</h2>
            <span className="budget-alloc-total-pct">{getTotalAllocation(categoryPercentages)}% allocated</span>
          </div>

          <Msg type="error"   text={budgetError}   />
          <Msg type="success" text={budgetSuccess} />

          <div className="budget-alloc-grid">
            {BUDGET_CATEGORIES.map((cat) => {
              const spent          = calculateExpensesByCategory(cat);
              const budget         = getCategoryBudget(cat);
              const pct            = getProgressPercentage(cat);
              const hasCustomLimit = categoryLimits[cat] != null;
              const isEditing      = editingLimitCat === cat;

              return (
                <div key={cat} className={`budget-alloc-item${isEditing ? " editing" : ""}`}>
                  {isEditing ? (
                    <div className="budget-edit-form">
                      <p className="budget-edit-form-title">Edit — {cat}</p>
                      <div className="budget-edit-fields">
                        <div className="budget-edit-field">
                          <label>Allocation %</label>
                          <div className="budget-edit-input-wrap">
                            <input
                              type="number" value={editingPercentageInput}
                              onChange={(e) => setEditingPercentageInput(e.target.value)}
                              min="0" max="100" step="0.1" placeholder="0" autoFocus
                            />
                            <span className="budget-edit-unit">%</span>
                          </div>
                        </div>
                        <div className="budget-edit-field">
                          <label>Fixed Limit (optional)</label>
                          <div className="budget-edit-input-wrap">
                            <span className="budget-edit-unit prefix">$</span>
                            <input
                              type="number" value={editingLimitInput}
                              onChange={(e) => setEditingLimitInput(e.target.value)}
                              min="0" step="0.01" placeholder="Auto from %"
                              style={{ paddingLeft: "20px", paddingRight: "10px" }}
                            />
                          </div>
                        </div>
                      </div>
                      <p className="budget-edit-hint">
                        Leave <strong>Fixed Limit</strong> empty to auto-calculate from % of income.
                      </p>
                      <div className="budget-edit-actions">
                        <button className="budget-save-btn"   onClick={() => handleSaveBudget(cat)}>Save</button>
                        <button className="budget-cancel-btn" onClick={() => { setEditingLimitCat(null); setEditingLimitInput(""); setEditingPercentageInput(""); showBudgetError(""); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="budget-alloc-row">
                        <span className="budget-alloc-name">
                          {cat} - {categoryPercentages[cat]}%
                          {hasCustomLimit && <span className="budget-custom-badge">custom</span>}
                        </span>
                        <div className="budget-alloc-right">
                          <span className={`budget-alloc-amounts${pct >= 100 ? " over" : ""}`}>
                            ${formatCurrency(spent)} / ${formatCurrency(budget)}
                          </span>
                          <button className="budget-edit-btn" onClick={() => openEditBudget(cat)} title={`Edit ${cat} budget`}>✏️</button>
                        </div>
                      </div>
                      <ProgressBar value={pct} max={100} height="6px"
                        color={pct >= 100 ? "#f87171" : pct >= 80 ? "#f59e0b" : "var(--budget-bar, #4a90e2)"} />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Category Manager (embedded) ── */}
          <CategoryManager />
        </div>

        {/* ── Income + Savings split ── */}
        <div className="income-savings-split" style={{ display: "flex", flexDirection: "column", padding: 0 }}>

          {/* Left — this month's income */}
          <div className="isplit-half">
            <span className="isplit-label">Total Income</span>
            <span className="isplit-value" style={{ color: "var(--success)" }}>
              ${formatCurrency(calculateTotalIncome())}
            </span>
            <span className="isplit-sub">{selectedMonthLabel}</span>
          </div>

          <div className="isplit-divider" />

          {/* Right — savings */}
          <div className="isplit-half">
            <span className="isplit-label">Savings</span>

            {/* This month */}
            <div className="isplit-row">
              <span className="isplit-row-label">This month</span>
              <span className="isplit-row-value"
                style={{ color: calculateThisMonthSavings() >= 0 ? "var(--success)" : "var(--error)" }}>
                {fmtSavings(calculateThisMonthSavings())}
              </span>
            </div>

            {/* Divider */}
            <div className="isplit-inner-divider" />

            {/* Total carried */}
            <div className="isplit-row">
              <span className="isplit-row-label">Total carried</span>
              <span className="isplit-row-value"
                style={{ color: calculateTotalCarried() >= 0 ? "var(--success)" : "var(--error)" }}>
                {fmtSavings(calculateTotalCarried())}
              </span>
            </div>
          </div>

        </div>

        {/* ── Add Expense ── */}
        <div className="expenses-card">
          <h2>Add Expense</h2>
          <form className="expense-form" onSubmit={handleExpenseSubmit}>
            <label htmlFor="description">Description</label>
            <input
              type="text" id="description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); showExpenseError(""); }}
              placeholder="e.g. Grocery shopping"
            />

            <label htmlFor="exp-category">Category</label>
            <div className="expense-category-wrap">
              <select
                id="exp-category"
                className="expense-category-select"
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
              >
                <option value="auto">✨ Auto-detect (AI)</option>
                <optgroup label="Categories">
                  {[...BUDGET_CATEGORIES, "Other"].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              </select>
              {manualCategory === "auto" && (
                <span className="expense-category-badge ai">AI</span>
              )}
            </div>

            <label htmlFor="amount">Amount ($)</label>
            <input
              type="number" id="amount"
              value={amount} min="0" step="0.01"
              onChange={(e) => { setAmount(e.target.value); showExpenseError(""); }}
              placeholder="0.00"
            />
            <label htmlFor="date">Date</label>
            <input type="date" id="date" value={date} max={getTodayLocal()} onChange={(e) => setDate(e.target.value)} />
            <Msg type="error"   text={expenseError}   />
            <Msg type="success" text={expenseSuccess} />
            <button type="submit" className="expense-add-btn" disabled={expenseSubmitting}>
              {expenseSubmitting ? (manualCategory === "auto" ? "Predicting…" : "Adding…") : "Add Expense"}
            </button>
          </form>
        </div>

        {/* ── Add Income ── */}
        <div className="income-card">
          <h2>Add Income</h2>
          <form className="income-form" onSubmit={handleIncomeSubmit}>
            <label htmlFor="income-amount">Amount ($)</label>
            <input
              type="number" id="income-amount"
              value={incomeAmount} min="0" step="0.01"
              onChange={(e) => { setIncomeAmount(e.target.value); showIncomeError(""); }}
              placeholder="0.00"
            />
            <label htmlFor="source">Source</label>
            <input
              type="text" id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Salary, Freelance"
            />
            <label htmlFor="income-date">Date</label>
            <input type="date" id="income-date" value={incomeDate} max={getTodayLocal()} onChange={(e) => setIncomeDate(e.target.value)} />
            <Msg type="error"   text={incomeError}   />
            <Msg type="success" text={incomeSuccess} />
            <button type="submit" className="income-add-btn">Add Income</button>
          </form>
        </div>

        {/* ── Recent Expenses ── */}
        <div className="recent-expenses-card">
          <h2>Recent Expenses</h2>
          <table className="recent-expenses-table">
            <thead>
              <tr>
                <th>Description</th><th>Amount</th><th>Category</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentExpenses.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: "center", padding: "12px", color: "var(--text-muted)" }}>No expenses yet</td></tr>
              ) : (
                recentExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>{exp.description || "—"}</td>
                    <td>${formatCurrency(parseFloat(exp.amount) || 0)}</td>
                    <td>{exp.category || "—"}</td>
                    <td>{formatDate(exp.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
