import { Link } from "react-router-dom";
import "./Home.css";

const features = [
  {
    icon: "📊",
    title: "Smart Analytics",
    desc: "Visualize your spending patterns with interactive charts and monthly breakdowns.",
  },
  {
    icon: "🧾",
    title: "Receipt OCR",
    desc: "Upload a receipt photo and we'll extract the merchant, amount, and date automatically.",
  },
  {
    icon: "🤖",
    title: "AI Categorization",
    desc: "Our ML model predicts expense categories so you never have to tag manually.",
  },
  {
    icon: "💰",
    title: "Budget Allocation",
    desc: "Set percentage-based budgets per category and track how close you are in real time.",
  },
  {
    icon: "📅",
    title: "Monthly View",
    desc: "Navigate through months to compare your spending history at a glance.",
  },
  {
    icon: "🔒",
    title: "Private & Secure",
    desc: "Your data is yours alone. Every account is fully isolated with JWT auth.",
  },
];

const stats = [
  { value: "100%", label: "Private" },
  { value: "AI", label: "Powered" },
  { value: "Real-time", label: "Updates" },
];

const Home = () => {
  return (
    <div className="home">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-bg">
          <div className="home-orb home-orb-1" />
          <div className="home-orb home-orb-2" />
          <div className="home-grid-lines" />
        </div>

        <div className="home-hero-content">
          <div className="home-badge">Personal Finance · Powered by AI</div>
          <h1 className="home-headline">
            Take control of<br />
            <span className="home-headline-accent">your money.</span>
          </h1>
          <p className="home-subheading">
            BudgetPal combines smart receipt scanning, AI categorization,
            and real-time analytics to give you a complete picture of your finances.
          </p>
          <div className="home-cta-group">
            <Link to="/signup" className="home-btn-primary">Get Started Free</Link>
            <Link to="/login" className="home-btn-secondary">Sign In →</Link>
          </div>

          <div className="home-stats">
            {stats.map((s) => (
              <div className="home-stat" key={s.label}>
                <span className="home-stat-value">{s.value}</span>
                <span className="home-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard preview card */}
        <div className="home-preview">
          <div className="home-preview-card">
            <div className="home-preview-header">
              <span className="home-preview-dot red" />
              <span className="home-preview-dot yellow" />
              <span className="home-preview-dot green" />
              <span className="home-preview-title">Dashboard · April 2026</span>
            </div>
            <div className="home-preview-body">
              <div className="home-preview-row">
                <div className="home-preview-metric">
                  <span className="home-preview-metric-label">Net Balance</span>
                  <span className="home-preview-metric-value green">+$1,240.50</span>
                </div>
                <div className="home-preview-metric">
                  <span className="home-preview-metric-label">Total Spent</span>
                  <span className="home-preview-metric-value red">-$859.50</span>
                </div>
                <div className="home-preview-metric">
                  <span className="home-preview-metric-label">Income</span>
                  <span className="home-preview-metric-value">$2,100.00</span>
                </div>
              </div>
              <div className="home-preview-bars">
                {[
                  { label: "Housing", pct: 72, color: "#f59e0b" },
                  { label: "Food", pct: 54, color: "#22c55e" },
                  { label: "Transport", pct: 38, color: "#6366f1" },
                  { label: "Shopping", pct: 25, color: "#ec4899" },
                ].map((b) => (
                  <div className="home-preview-bar-row" key={b.label}>
                    <span className="home-preview-bar-label">{b.label}</span>
                    <div className="home-preview-bar-track">
                      <div
                        className="home-preview-bar-fill"
                        style={{ width: `${b.pct}%`, background: b.color }}
                      />
                    </div>
                    <span className="home-preview-bar-pct">{b.pct}%</span>
                  </div>
                ))}
              </div>
              <div className="home-preview-receipts">
                <span className="home-preview-section-label">Recent Receipts</span>
                {[
                  { name: "Shoppers Drug Mart", amt: "$9.14", cat: "Healthcare" },
                  { name: "Tim Hortons", amt: "$6.75", cat: "Food" },
                  { name: "TTC Transit", amt: "$3.25", cat: "Transport" },
                ].map((r) => (
                  <div className="home-preview-receipt-row" key={r.name}>
                    <span className="home-preview-receipt-name">{r.name}</span>
                    <span className="home-preview-receipt-cat">{r.cat}</span>
                    <span className="home-preview-receipt-amt">{r.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="home-section-label">Everything you need</div>
        <h2 className="home-section-title">Built for real people,<br />not spreadsheet nerds.</h2>
        <div className="home-features-grid">
          {features.map((f, i) => (
            <div className="home-feature-card" key={f.title} style={{ animationDelay: `${i * 0.08}s` }}>
              <span className="home-feature-icon">{f.icon}</span>
              <h3 className="home-feature-title">{f.title}</h3>
              <p className="home-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="home-cta-banner">
        <div className="home-cta-banner-bg" />
        <h2 className="home-cta-banner-title">Start tracking today.</h2>
        <p className="home-cta-banner-sub">Free to use. No credit card required.</p>
        <Link to="/signup" className="home-btn-primary large">Create Free Account</Link>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <span className="home-footer-logo">BudgetPal</span>
        <span className="home-footer-copy">© 2026 · Built with ❤️</span>
      </footer>
    </div>
  );
};

export default Home;
