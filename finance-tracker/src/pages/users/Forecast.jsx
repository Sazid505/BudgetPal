import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell
} from "recharts";

const COLORS = [
  "#6366f1","#22c55e","#f59e0b","#ef4444","#06b6d4",
  "#a855f7","#84cc16","#f97316","#3b82f6","#ec4899",
];

const fmt = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const TrendArrow = ({ predicted, last }) => {
  if (last == null || predicted == null) return null;
  const diff = predicted - last;
  const pct  = last > 0 ? ((diff / last) * 100).toFixed(1) : 0;
  const up   = diff >= 0;
  return (
    <span style={{ fontSize: "12px", color: up ? "#f87171" : "#4ade80", marginLeft: "6px" }}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
};

const Forecast = () => {
  const [totalData,    setTotalData]    = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  // Track theme for Recharts props
  const [isDark, setIsDark] = useState(!document.body.classList.contains("theme-light"));
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(!document.body.classList.contains("theme-light")));
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api("/api/forecast/total").then((r) => r.json()),
      api("/api/forecast/category").then((r) => r.json()),
    ])
      .then(([total, category]) => { setTotalData(total); setCategoryData(category); })
      .catch(() => setError("Could not load forecast. Make sure the server is running."))
      .finally(() => setLoading(false));
  }, []);

  const gridStroke    = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const axisStyle     = { fill: isDark ? "#6e6b64" : "#999", fontSize: 11 };
  const tooltipStyle  = {
    contentStyle: {
      background:   isDark ? "#1a1a24" : "#fff",
      border:       `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e5e5"}`,
      borderRadius: 10,
      color:        isDark ? "#f0ede8" : "#1a1a1a",
      fontSize:     13,
    },
    itemStyle:  { color: isDark ? "#f0ede8" : "#1a1a1a" },
    labelStyle: { color: isDark ? "#9e9b95" : "#555", fontWeight: 600, fontSize: 11 },
  };
  const legendStyle = { fontSize: 12, color: isDark ? "#9e9b95" : "#555" };

  // card / text colours that respond to theme
  const cardBg      = isDark ? "var(--bg-card)"    : "#ffffff";
  const cardBorder  = isDark ? "var(--border)"     : "#e8e5e0";
  const textPrimary = isDark ? "var(--text-primary)"   : "#1a1a1a";
  const textMuted   = isDark ? "var(--text-muted)"     : "#888";
  const textSecondary = isDark ? "var(--text-secondary)" : "#555";

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: textMuted, background: "var(--bg-base)", minHeight: "calc(100vh - 60px)", fontFamily: "var(--font-body)" }}>
        <p style={{ fontSize: "1rem" }}>⏳ Running forecast model…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", background: "var(--bg-base)", minHeight: "calc(100vh - 60px)", fontFamily: "var(--font-body)" }}>
        <p style={{ color: "var(--error)" }}>{error}</p>
      </div>
    );
  }

  const hasWarning = totalData?.warning || categoryData?.warning;
  if (hasWarning) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", background: "var(--bg-base)", minHeight: "calc(100vh - 60px)", fontFamily: "var(--font-body)" }}>
        <div style={{ background: isDark ? "rgba(245,158,11,0.1)" : "#fff7ed", border: `1px solid ${isDark ? "rgba(245,158,11,0.25)" : "#fed7aa"}`, borderRadius: "14px", padding: "2rem", maxWidth: "480px", margin: "0 auto" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📊</p>
          <h3 style={{ color: isDark ? "#fbbf24" : "#c2410c", marginBottom: "8px", fontFamily: "var(--font-serif)" }}>Not enough data yet</h3>
          <p style={{ color: isDark ? "#9e9b95" : "#92400e", fontSize: "14px", lineHeight: 1.6 }}>
            Add at least <strong>2 months</strong> of expenses to generate a spending forecast.
            Keep using BudgetPal and come back here soon!
          </p>
        </div>
      </div>
    );
  }

  // Build combined chart data
  const historical = (totalData?.historical || []).map((h) => ({
    month: h.month, actual: parseFloat(h.total), predicted: null,
  }));
  const forecastPoints = (totalData?.forecast || []).map((f) => ({
    month: f.month, actual: null, predicted: parseFloat(f.predicted),
  }));
  if (historical.length > 0 && forecastPoints.length > 0) {
    forecastPoints[0] = { ...forecastPoints[0], bridge: historical[historical.length - 1].actual };
  }
  const combinedData = [...historical, ...forecastPoints];
  const lastActual   = historical.length > 0 ? historical[historical.length - 1].actual : null;

  const nextMonth     = totalData?.forecast?.[0]?.month;
  const catForecast   = categoryData?.forecast || {};
  const categoryBars  = Object.entries(catForecast)
    .map(([cat, months]) => ({ category: cat, predicted: months[0]?.predicted ?? 0 }))
    .filter((c) => c.predicted > 0)
    .sort((a, b) => b.predicted - a.predicted);

  return (
    <div style={{ padding: "2rem", fontFamily: "var(--font-body)", background: "var(--bg-base)", minHeight: "calc(100vh - 60px)" }}>

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 700, color: textPrimary, margin: "0 0 6px" }}>
          Spending Forecast
        </h1>
        <p style={{ color: textMuted, fontSize: "0.88rem", margin: 0 }}>
          Predicted based on your historical spending patterns using linear regression + ML model.
        </p>
      </div>

      {/* Summary forecast cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {(totalData?.forecast || []).map((f, i) => (
          <div key={f.month} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.25rem", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>
              {f.month}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: textPrimary, margin: 0, fontFamily: "var(--font-body)", letterSpacing: "-0.02em" }}>
                {fmt(f.predicted)}
              </h2>
              <TrendArrow predicted={f.predicted} last={i === 0 ? lastActual : totalData.forecast[i - 1]?.predicted} />
            </div>
            <p style={{ fontSize: "0.75rem", color: textMuted, margin: "4px 0 0" }}>Predicted total spend</p>
          </div>
        ))}
      </div>

      {/* Actual vs Predicted line chart */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.06)" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: textPrimary, margin: "0 0 1rem" }}>
          Actual vs Predicted Spending
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={combinedData} margin={{ right: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `$${v}`} tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} formatter={(v) => v != null ? fmt(v) : null} />
            <Legend wrapperStyle={legendStyle} />
            <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls={false} name="Actual" />
            <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls={false} name="Predicted" />
            <Line type="monotone" dataKey="bridge" stroke="#f59e0b" strokeWidth={2.5} dot={false} legendType="none" connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: "0.72rem", color: textMuted, marginTop: "8px", textAlign: "center" }}>
          Solid = actual spending · Dashed = predicted
        </p>
      </div>

      {/* Category forecast bar chart */}
      {categoryBars.length > 0 && (
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.5rem", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: textPrimary, margin: "0 0 4px" }}>
            Predicted by Category
          </h3>
          <p style={{ fontSize: "0.78rem", color: textMuted, margin: "0 0 1rem" }}>
            Forecast for {nextMonth}
          </p>
          <ResponsiveContainer width="100%" height={Math.max(220, categoryBars.length * 36)}>
            <BarChart data={categoryBars} layout="vertical" margin={{ left: 10, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
              <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" width={120} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v) => fmt(v)} />
              <Bar dataKey="predicted" radius={[0, 6, 6, 0]} name="Predicted">
                {categoryBars.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
};

export default Forecast;
