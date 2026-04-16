import "../../App.css";
import { useEffect, useMemo, useState } from "react";
import { parseLocalYearMonth } from "../../utils/format";
import {
  LineChart, BarChart, Bar,
  ResponsiveContainer, Legend, Tooltip,
  Line, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const ALL_CATEGORIES = [
  "Food","Transportation","Healthcare","Miscellaneous","Housing",
  "Entertainment","Shopping","Personal","Debt Payments","Education",
  "Savings/Investments","Other",
];

// Keep original line colours — these look great on both dark and light
const COLORS = [
  "#6366f1","#22c55e","#f59e0b","#ef4444","#06b6d4",
  "#a855f7","#84cc16","#f97316","#3b82f6","#ec4899","#14b8a6","#64748b",
];

function normalizeDate(val) {
  if (!val) return null;
  if (typeof val === "string") return val.slice(0, 10);
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

function getCategories(expenses) {
  const base = new Set(ALL_CATEGORIES);
  expenses.forEach((e) => { if (e.category) base.add(e.category.trim()); });
  return Array.from(base);
}

function buildMonthlyData(expenses, categories) {
  const data = Array(12).fill(null).map((_, i) => {
    const row = { month: months[i] };
    categories.forEach((c) => { row[c] = 0; });
    return row;
  });
  expenses.forEach((exp) => {
    const date = normalizeDate(exp.date);
    const parsed = parseLocalYearMonth(date);
    if (!parsed) return;
    const cat = (exp.category || "Other").trim();
    const amt = Number(exp.amount) || 0;
    if (data[parsed.monthIndex][cat] === undefined) data[parsed.monthIndex][cat] = 0;
    data[parsed.monthIndex][cat] += amt;
  });
  return data;
}

function buildCategoryTotals(expenses) {
  const totals = {};
  expenses.forEach((exp) => {
    const cat = (exp.category || "Other").trim();
    totals[cat] = (totals[cat] || 0) + (Number(exp.amount) || 0);
  });
  return Object.entries(totals)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

function buildTableData(expenses, categories) {
  const table = {};
  categories.forEach((c) => { table[c] = Array(12).fill(0); });
  expenses.forEach((exp) => {
    const date = normalizeDate(exp.date);
    const parsed = parseLocalYearMonth(date);
    if (!parsed) return;
    const cat = (exp.category || "Other").trim();
    if (!table[cat]) table[cat] = Array(12).fill(0);
    table[cat][parsed.monthIndex] += Number(exp.amount) || 0;
  });
  return Object.fromEntries(
    Object.entries(table).filter(([, arr]) => arr.some((v) => v > 0))
  );
}

const Analytics = ({ expenses }) => {
  // Track theme so Recharts props update live when user switches mode
  const [isDark, setIsDark] = useState(!document.body.classList.contains("theme-light"));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(!document.body.classList.contains("theme-light"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Recharts theme tokens
  const chartTheme = useMemo(() => ({
    gridStroke:  isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    axisColor:   isDark ? "#6e6b64"                : "#999",
    tooltipBg:   isDark ? "#1a1a24"                : "#ffffff",
    tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "#e5e5e5",
    tooltipText: isDark ? "#f0ede8"                : "#1a1a1a",
    legendColor: isDark ? "#9e9b95"                : "#555",
  }), [isDark]);

  const tooltipStyle = {
    contentStyle: {
      background: chartTheme.tooltipBg,
      border: `1px solid ${chartTheme.tooltipBorder}`,
      borderRadius: 10,
      color: chartTheme.tooltipText,
      fontSize: 13,
    },
    itemStyle:  { color: chartTheme.tooltipText },
    labelStyle: { color: chartTheme.axisColor, fontWeight: 600, fontSize: 11 },
  };
  const axisStyle = { fill: chartTheme.axisColor, fontSize: 11 };

  // Tab switcher button styles
  const tabActive   = { background: isDark ? "#c8a96e" : "#1e1e1e", color: isDark ? "#0a0a0f" : "#fff" };
  const tabInactive = { background: "transparent", color: isDark ? "#6e6b64" : "#555" };

  const years = useMemo(() => {
    const set = new Set();
    expenses.forEach((exp) => {
      const date = normalizeDate(exp.date);
      const parsed = parseLocalYearMonth(date);
      if (parsed) set.add(parsed.year);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [expenses]);

  const [selectedYear, setSelectedYear] = useState(null);
  const [activeTab,    setActiveTab]    = useState("line");

  useEffect(() => {
    if (years.length === 0) return;
    if (selectedYear == null || !years.includes(selectedYear)) {
      setSelectedYear(years[years.length - 1]);
    }
  }, [years, selectedYear]);

  const filteredExpenses = useMemo(() => {
    if (!selectedYear) return [];
    return expenses.filter((exp) => {
      const date = normalizeDate(exp.date);
      const parsed = parseLocalYearMonth(date);
      return parsed && parsed.year === selectedYear;
    });
  }, [expenses, selectedYear]);

  const categories    = useMemo(() => getCategories(filteredExpenses), [filteredExpenses]);
  const monthlyData   = useMemo(() => buildMonthlyData(filteredExpenses, categories), [filteredExpenses, categories]);
  const categoryTotals = useMemo(() => buildCategoryTotals(filteredExpenses), [filteredExpenses]);
  const tableData     = useMemo(() => buildTableData(filteredExpenses, categories), [filteredExpenses, categories]);

  const totalSpend   = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const topCategory  = categoryTotals[0];
  const activeMonths = monthlyData.filter((m) => categories.some((c) => m[c] > 0)).length;

  const activeCategories = categories.filter((c) =>
    filteredExpenses.some((e) => (e.category || "Other").trim() === c)
  );

  if (expenses.length === 0) {
    return (
      <div className="analytics-empty">
        <h2>No data yet</h2>
        <p>Add expenses or upload receipts to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">

      {/* ── Summary Cards ── */}
      <div className="analytics-stats-row">
        <div className="analytics-stat-card analytics-stat-purple">
          <p className="analytics-stat-label">Total Spent {selectedYear}</p>
          <h2 className="analytics-stat-value">${totalSpend.toFixed(2)}</h2>
        </div>
        <div className="analytics-stat-card analytics-stat-green">
          <p className="analytics-stat-label">Top Category</p>
          <h2 className="analytics-stat-value">{topCategory ? topCategory.name : "—"}</h2>
          {topCategory && <p className="analytics-stat-sub">${topCategory.value.toFixed(2)}</p>}
        </div>
        <div className="analytics-stat-card analytics-stat-amber">
          <p className="analytics-stat-label">Active Months</p>
          <h2 className="analytics-stat-value">{activeMonths}</h2>
        </div>
      </div>

      {/* ── Trend Chart ── */}
      <div className="Line-graph">
        <div className="analytics-chart-header">
          <h2>Category Spending Trends {selectedYear ? `(${selectedYear})` : ""}</h2>
          <div className="analytics-chart-controls">
            {/* Tab switcher */}
            <div className="analytics-tab-group">
              {["line", "bar"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ ...(activeTab === tab ? tabActive : tabInactive), padding: "5px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, fontFamily: "inherit", transition: "background 0.2s" }}
                >
                  {tab === "line" ? "Line" : "Bar"}
                </button>
              ))}
            </div>
            {/* Year selector */}
            {years.length > 0 && (
              <select
                value={selectedYear ?? ""}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="analytics-year-select"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="analytics-no-data">No expenses for {selectedYear}</div>
        ) : (
          <ResponsiveContainer width="100%" aspect={3}>
            {activeTab === "line" ? (
              <LineChart data={monthlyData} margin={{ right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => `$${Number(v).toFixed(2)}`} />
                <Legend wrapperStyle={{ fontSize: 12, color: chartTheme.legendColor }} />
                {activeCategories.map((cat, i) => (
                  <Line key={cat} type="monotone" dataKey={cat} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                ))}
              </LineChart>
            ) : (
              <BarChart data={monthlyData} margin={{ right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => `$${Number(v).toFixed(2)}`} />
                <Legend wrapperStyle={{ fontSize: 12, color: chartTheme.legendColor }} />
                {activeCategories.map((cat, i) => (
                  <Bar key={cat} dataKey={cat} fill={COLORS[i % COLORS.length]} stackId="a" />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Category Breakdown ── */}
      {categoryTotals.length > 0 && (
        <div className="Line-graph" style={{ marginTop: "1.5rem" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.2rem" }}>Spending by Category</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryTotals} layout="vertical" margin={{ left: 20, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartTheme.gridStroke} />
              <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v) => `$${Number(v).toFixed(2)}`} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {categoryTotals.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Category × Month Table ── */}
      <div className="expense-display-card" style={{ marginTop: "1.5rem", overflowX: "auto" }}>
        <h2 style={{ fontSize: "1.2rem" }}>
          Spending by Category &amp; Month {selectedYear ? `(${selectedYear})` : ""}
        </h2>
        {Object.keys(tableData).length === 0 ? (
          <p className="analytics-no-data" style={{ padding: "2rem 0" }}>No expenses yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Category</th>
                {months.map((m) => <th key={m}>{m}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(tableData).map(([category, values]) => (
                <tr key={category}>
                  <td style={{ fontWeight: 600 }}>{category}</td>
                  {values.map((v, i) => (
                    <td key={i} className={v > 0 ? "analytics-td-value" : "analytics-td-empty"}>
                      {v > 0 ? `$${v.toFixed(2)}` : "—"}
                    </td>
                  ))}
                  <td style={{ fontWeight: 700, color: "#6366f1" }}>
                    ${values.reduce((s, v) => s + v, 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default Analytics;
