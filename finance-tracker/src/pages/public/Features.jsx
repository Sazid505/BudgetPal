import { Link } from "react-router-dom";
import "./Home.css";
import "./Features.css";

const features = [
  {
    icon: "🧾",
    tag: "OCR Technology",
    title: "Receipt Scanning",
    desc: "Simply upload a photo of any receipt. Our OCR engine powered by Tesseract extracts the merchant name, total amount, and date automatically — no typing required.",
    points: ["Supports JPEG, PNG, TIFF formats", "Auto-rotates skewed images", "Works with printed receipts"],
  },
  {
    icon: "🤖",
    tag: "Machine Learning",
    title: "AI Categorization",
    desc: "Every expense — whether uploaded via receipt or entered manually — is automatically categorized using a trained ML model.",
    points: ["Trained on thousands of descriptions", "12 smart categories", "Falls back to 'Other' gracefully"],
  },
  {
    icon: "📊",
    tag: "Analytics",
    title: "Spending Analytics",
    desc: "Understand your money with interactive line and bar charts. See exactly where each dollar goes, broken down by category and month.",
    points: ["Line chart & bar chart toggle", "Category breakdown bar chart", "Monthly spending table with totals"],
  },
  {
    icon: "💰",
    tag: "Budgeting",
    title: "Budget Allocation",
    desc: "Set custom percentage-based budgets for each spending category. Track how much of your income is left in each bucket with real-time progress bars.",
    points: ["10 configurable categories", "Percentage-based budgeting", "Overspend alerts in red"],
  },
  {
    icon: "📅",
    tag: "Navigation",
    title: "Monthly View",
    desc: "Use the month navigator on your dashboard to jump between months and compare how your spending has changed over time.",
    points: ["← → arrow navigation", "Instant dashboard updates", "Compare any past month"],
  },
  {
    icon: "🔒",
    tag: "Security",
    title: "Secure Authentication",
    desc: "Every account is fully isolated. JWT tokens protect all API endpoints and your data is scoped entirely to your user account.",
    points: ["Bcrypt password hashing", "JWT token authentication", "Per-user data isolation"],
  },
  {
    icon: "🗂️",
    tag: "History",
    title: "Receipt History",
    desc: "Browse all your uploaded receipts in a visual grid. Search by merchant, filter by category, and click any card to see the full OCR text.",
    points: ["Visual card grid with thumbnails", "Search & category filter", "Delete receipt + linked expense"],
  },
  {
    icon: "📈",
    tag: "Dashboard",
    title: "Live Dashboard",
    desc: "Your financial command center. See net balance, total income, budget progress, and recent expenses — all updated in real time.",
    points: ["Real-time net balance", "Budget progress bars", "5 most recent expenses"],
  },
];

const Features = () => {
  return (
    <div className="feat-page">
      {/* Hero */}
      <section className="feat-hero">
        <div className="home-hero-bg">
          <div className="home-orb home-orb-1" style={{ opacity: 0.12 }} />
          <div className="home-grid-lines" />
        </div>
        <div className="feat-hero-content">
          <div className="home-badge">What's inside</div>
          <h1 className="feat-hero-title">
            Everything you need to<br />
            <span className="home-headline-accent">master your budget.</span>
          </h1>
          <p className="feat-hero-sub">
            From AI-powered receipt scanning to real-time analytics —
            BudgetPal gives you the full picture of your finances in one place.
          </p>
          <Link to="/signup" className="home-btn-primary">Get Started Free</Link>
        </div>
      </section>

      {/* 2-column feature grid */}
      <section className="feat-grid">
        {features.map((f) => (
          <div className="feat-card" key={f.title}>
            <div className="feat-card-top">
              <div className="feat-card-icon-wrap">
                <span className="feat-card-icon">{f.icon}</span>
              </div>
              <span className="feat-card-tag">{f.tag}</span>
            </div>
            <h2 className="feat-card-title">{f.title}</h2>
            <p className="feat-card-desc">{f.desc}</p>
            <ul className="feat-card-points">
              {f.points.map((p) => (
                <li key={p}>
                  <span className="feat-check">✓</span> {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="home-cta-banner">
        <div className="home-cta-banner-bg" />
        <h2 className="home-cta-banner-title">Ready to get started?</h2>
        <p className="home-cta-banner-sub">Create your free account in under a minute.</p>
        <Link to="/signup" className="home-btn-primary large">Sign Up Free</Link>
      </section>

      <footer className="home-footer">
        <span className="home-footer-logo">BudgetPal</span>
        <span className="home-footer-copy">© 2026 · Built with ❤️</span>
      </footer>
    </div>
  );
};

export default Features;
