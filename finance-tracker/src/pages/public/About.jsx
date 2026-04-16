import "./Home.css";
import "./About.css";

const team = [
  {
    name: "MD. Sazid",
    id: "301387514",
    emoji: "👨‍💻",
    role: "Full Stack Developer",
    contrib: "Backend architecture, MySQL database design, JWT authentication, receipt OCR pipeline and ML integration.",
  },
  {
    name: "Rohaan Talpur",
    id: "301372121",
    emoji: "🎨",
    role: "Frontend Developer",
    contrib: "React component development, dashboard UI, expense & analytics pages, responsive design system.",
  },
  {
    name: "Maaz Bobat",
    id: "301360037",
    emoji: "🤖",
    role: "ML Engineer",
    contrib: "Expense categorization model training, Python OCR text extraction, category prediction API.",
  },
  {
    name: "Krishna Kumar Mahato",
    id: "301400726",
    emoji: "📊",
    role: "Data & Testing",
    contrib: "Analytics implementation, data validation, testing & quality assurance, database optimization.",
  },
];

const stack = [
  { label: "Frontend", items: ["React 18", "Vite", "Recharts", "CSS3"] },
  { label: "Backend", items: ["Node.js", "Express.js", "MySQL", "JWT"] },
  { label: "AI / ML", items: ["Python", "Tesseract OCR", "scikit-learn", "OpenCV"] },
  { label: "Tools", items: ["VS Code", "MySQL Workbench", "Git", "npm"] },
];

const About = () => {
  return (
    <div className="about-page">

      {/* Hero */}
      <section className="about-hero">
        <div className="home-hero-bg">
          <div className="home-orb home-orb-2" style={{ opacity: 0.1 }} />
          <div className="home-grid-lines" />
        </div>
        <div className="about-hero-content">
          <div className="home-badge">About the Project</div>
          <h1 className="about-hero-title">
            Built by students,<br />
            <span className="home-headline-accent">for real people.</span>
          </h1>
          <p className="about-hero-sub">
            BudgetPal is a capstone project developed by four students in the
            Software Engineering Technology AI program at Centennial College.
            Our goal was to build a genuinely useful, AI-powered personal finance tool.
          </p>

          <div className="about-course-badge">
            <div className="about-course-row">
              <span className="about-course-label">Program</span>
              <span className="about-course-value">Software Engineering Technology AI</span>
            </div>
            <div className="about-course-divider" />
            <div className="about-course-row">
              <span className="about-course-label">Course Code</span>
              <span className="about-course-value">3402 · Section 001</span>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="about-team">
        <div className="about-section-label">The Team</div>
        <h2 className="about-section-title">Meet the developers</h2>
        <div className="about-team-grid">
          {team.map((m) => (
            <div className="about-member-card" key={m.id}>
              <div className="about-member-avatar">{m.emoji}</div>
              <div className="about-member-info">
                <h3 className="about-member-name">{m.name}</h3>
                <span className="about-member-id">ID: {m.id}</span>
                <span className="about-member-role">{m.role}</span>
                <p className="about-member-contrib">{m.contrib}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="about-stack">
        <div className="about-section-label">Technology</div>
        <h2 className="about-section-title">Built with</h2>
        <div className="about-stack-grid">
          {stack.map((s) => (
            <div className="about-stack-card" key={s.label}>
              <h3 className="about-stack-label">{s.label}</h3>
              <div className="about-stack-items">
                {s.items.map((item) => (
                  <span className="about-stack-tag" key={item}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="about-mission">
        <div className="about-mission-inner">
          <div className="about-section-label">Our Mission</div>
          <h2 className="about-section-title" style={{ maxWidth: "100%" }}>
            Why we built BudgetPal
          </h2>
          <p className="about-mission-text">
            Managing personal finances is a challenge that affects everyone, yet most tools are
            either too complex, too expensive, or require too much manual effort. We set out to build
            something different — an app that uses AI to do the heavy lifting, so you can focus on
            making better financial decisions rather than tracking every transaction by hand.
          </p>
          <p className="about-mission-text">
            By combining receipt OCR, machine learning categorization, and real-time analytics,
            BudgetPal gives you a clear, effortless view of where your money goes each month.
          </p>
        </div>
      </section>

      <footer className="home-footer">
        <span className="home-footer-logo">BudgetPal</span>
        <span className="home-footer-copy">© 2026 · Centennial College · SETA 3402</span>
      </footer>
    </div>
  );
};

export default About;
