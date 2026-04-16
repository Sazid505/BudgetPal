import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";

/* ── Theme helper — applied as body class ── */
function applyTheme(t) {
  if (t === "light") {
    document.body.classList.add("theme-light");
    document.body.classList.remove("theme-dark");
  } else {
    document.body.classList.remove("theme-light");
    document.body.classList.add("theme-dark");
  }
  localStorage.setItem("theme", t);
}

/* ── Accessibility helpers ── */
function applyA11y({ fontSize, highContrast, reducedMotion, focusRing }) {
  const html = document.documentElement;
  const body = document.body;

  // Font size — change the HTML root so ALL rem units scale
  if (fontSize === "large")       html.style.fontSize = "19px";
  else if (fontSize === "xlarge") html.style.fontSize = "22px";
  else                            html.style.fontSize = "";   // reset to browser default (16px)

  // High contrast
  highContrast ? body.classList.add("a11y-contrast") : body.classList.remove("a11y-contrast");

  // Reduced motion — also set a <style> tag so media-query-agnostic apps respect it
  if (reducedMotion) {
    body.classList.add("a11y-reduced");
    let style = document.getElementById("a11y-reduced-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "a11y-reduced-style";
      document.head.appendChild(style);
    }
    style.textContent = `*, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }`;
  } else {
    body.classList.remove("a11y-reduced");
    const style = document.getElementById("a11y-reduced-style");
    if (style) style.remove();
  }

  // Focus ring
  focusRing ? body.classList.add("a11y-focus") : body.classList.remove("a11y-focus");
}

function loadA11y() {
  try { return JSON.parse(localStorage.getItem("a11y") || "{}"); } catch { return {}; }
}

const Settings = ({ user, setUser }) => {
  const navigate = useNavigate();

  // ── Profile ──────────────────────────────────────
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Password ──────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passMsg, setPassMsg] = useState("");
  const [passError, setPassError] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  // ── Appearance ────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  // ── Preferences ──────────────────────────────────
  const [currency, setCurrency] = useState(() => localStorage.getItem("currency") || "$");
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem("dateFormat") || "MM/DD/YYYY");
  const [prefMsg, setPrefMsg] = useState("");

  // ── Accessibility ─────────────────────────────────
  const [a11yFontSize, setA11yFontSize] = useState(() => loadA11y().fontSize || "default");
  const [a11yHighContrast, setA11yHighContrast] = useState(() => !!loadA11y().highContrast);
  const [a11yReducedMotion, setA11yReducedMotion] = useState(() => !!loadA11y().reducedMotion);
  const [a11yFocusRing, setA11yFocusRing] = useState(() => !!loadA11y().focusRing);
  const [a11yMsg, setA11yMsg] = useState("");

  // ── Delete account ───────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Apply theme whenever it changes
  useEffect(() => { applyTheme(theme); }, [theme]);

  // Sync user prop → form state
  useEffect(() => {
    if (user) { setName(user.name || ""); setEmail(user.email || ""); }
  }, [user]);

  // Apply saved accessibility settings on mount
  useEffect(() => {
    applyA11y({ fontSize: a11yFontSize, highContrast: a11yHighContrast, reducedMotion: a11yReducedMotion, focusRing: a11yFocusRing });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setProfileError("Name is required."); return; }
    if (!email.trim()) { setProfileError("Email is required."); return; }
    setProfileLoading(true); setProfileMsg(""); setProfileError("");
    try {
      const res = await api("/api/auth/profile", { method: "PUT", body: JSON.stringify({ name: name.trim(), email: email.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setProfileMsg("Profile updated successfully!");
      if (data.user && setUser) { setUser(data.user); localStorage.setItem("user", JSON.stringify(data.user)); }
    } catch (err) { setProfileError(err.message); }
    finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword) { setPassError("Please enter your current password."); return; }
    if (newPassword.length < 6) { setPassError("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPassError("New passwords do not match."); return; }
    setPassLoading(true); setPassMsg(""); setPassError("");
    try {
      const res = await api("/api/auth/password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password change failed");
      setPassMsg("Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) { setPassError(err.message); }
    finally { setPassLoading(false); }
  };

  const handlePreferencesSave = () => {
    localStorage.setItem("currency", currency);
    localStorage.setItem("dateFormat", dateFormat);
    setPrefMsg("Preferences saved!"); setTimeout(() => setPrefMsg(""), 3000);
  };

  const handleA11ySave = () => {
    const config = { fontSize: a11yFontSize, highContrast: a11yHighContrast, reducedMotion: a11yReducedMotion, focusRing: a11yFocusRing };
    localStorage.setItem("a11y", JSON.stringify(config));
    applyA11y(config);   // focusRing is now handled inside applyA11y
    setA11yMsg("Accessibility settings applied!"); setTimeout(() => setA11yMsg(""), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") { setDeleteError('Please type "DELETE" exactly to confirm.'); return; }
    setDeleteLoading(true); setDeleteError("");
    try {
      const res = await api("/api/auth/delete", { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Deletion failed"); }
      localStorage.removeItem("token"); localStorage.removeItem("user"); localStorage.removeItem("a11y");
      if (setUser) setUser(null);
      navigate("/home");
    } catch (err) { setDeleteError(err.message); setDeleteLoading(false); }
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { label: "Too short", color: "#f87171", width: "20%" };
    if (pwd.length < 8) return { label: "Weak", color: "#fb923c", width: "40%" };
    const score = [/[A-Z]/, /[a-z]/, /\d/, /[^a-zA-Z0-9]/].filter((r) => r.test(pwd)).length;
    if (score <= 2) return { label: "Fair", color: "#fbbf24", width: "55%" };
    if (score === 3) return { label: "Good", color: "#4ade80", width: "75%" };
    return { label: "Strong", color: "#22c55e", width: "100%" };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="settings-page">
      {/* ── Header ── */}
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        {user && (
          <div className="settings-user-badge">
            <div className="settings-avatar">{(user.name || "?")[0].toUpperCase()}</div>
            <div>
              <div className="settings-user-name">{user.name}</div>
              <div className="settings-user-email">{user.email}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Appearance ── */}
      <section className="settings-card">
        <div className="settings-card-header">
          <span className="settings-card-icon">🎨</span>
          <h2>Appearance</h2>
        </div>
        <div className="theme-toggle-row">
          <button
            type="button"
            className={`theme-toggle-btn${theme === "dark" ? " active" : ""}`}
            onClick={() => setTheme("dark")}
            aria-pressed={theme === "dark"}
          >
            <span className="theme-toggle-icon">🌙</span>
            <span className="theme-toggle-label">Dark Mode</span>
            <span className="theme-toggle-desc">Easy on the eyes at night — the default BudgetPal look.</span>
          </button>
          <button
            type="button"
            className={`theme-toggle-btn${theme === "light" ? " active" : ""}`}
            onClick={() => setTheme("light")}
            aria-pressed={theme === "light"}
          >
            <span className="theme-toggle-icon">☀️</span>
            <span className="theme-toggle-label">Light Mode</span>
            <span className="theme-toggle-desc">Clean white interface for bright environments.</span>
          </button>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.75rem 0 0" }}>
          Your preference is saved automatically and restored on every visit.
        </p>
      </section>

      {/* ── Profile ── */}
      <section className="settings-card">
        <div className="settings-card-header">
          <span className="settings-card-icon">👤</span>
          <h2>Profile Information</h2>
        </div>
        <form onSubmit={handleProfileSave}>
          <div className="settings-fields-row">
            <div className="settings-field">
              <label htmlFor="sett-name">Full Name</label>
              <input id="sett-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="settings-field">
              <label htmlFor="sett-email">Email Address</label>
              <input id="sett-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
          </div>
          {profileMsg && <p className="settings-success">{profileMsg}</p>}
          {profileError && <p className="settings-error">{profileError}</p>}
          <button type="submit" className="settings-btn" disabled={profileLoading}>
            {profileLoading ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </section>

      {/* ── Password ── */}
      <section className="settings-card">
        <div className="settings-card-header">
          <span className="settings-card-icon">🔒</span>
          <h2>Change Password</h2>
        </div>
        <form onSubmit={handlePasswordChange}>
          <div className="settings-field">
            <label htmlFor="sett-cur-pass">Current Password</label>
            <div className="settings-input-wrap">
              <input id="sett-cur-pass" type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              <button type="button" className="settings-eye-btn" onClick={() => setShowCurrent((v) => !v)} tabIndex={-1}>{showCurrent ? "🙈" : "👁️"}</button>
            </div>
          </div>
          <div className="settings-fields-row">
            <div className="settings-field">
              <label htmlFor="sett-new-pass">New Password</label>
              <div className="settings-input-wrap">
                <input id="sett-new-pass" type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
                <button type="button" className="settings-eye-btn" onClick={() => setShowNew((v) => !v)} tabIndex={-1}>{showNew ? "🙈" : "👁️"}</button>
              </div>
              {strength && (
                <div className="settings-strength">
                  <div className="settings-strength-bar"><div className="settings-strength-fill" style={{ width: strength.width, background: strength.color }} /></div>
                  <span style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>
            <div className="settings-field">
              <label htmlFor="sett-confirm-pass">Confirm New Password</label>
              <div className="settings-input-wrap">
                <input id="sett-confirm-pass" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
                <button type="button" className="settings-eye-btn" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}>{showConfirm ? "🙈" : "👁️"}</button>
              </div>
              {confirmPassword && newPassword && (
                <p className="settings-match-hint" style={{ color: confirmPassword === newPassword ? "#4ade80" : "#f87171" }}>
                  {confirmPassword === newPassword ? "✓ Passwords match" : "✗ Do not match"}
                </p>
              )}
            </div>
          </div>
          {passMsg && <p className="settings-success">{passMsg}</p>}
          {passError && <p className="settings-error">{passError}</p>}
          <button type="submit" className="settings-btn" disabled={passLoading}>{passLoading ? "Updating…" : "Change Password"}</button>
        </form>
      </section>

      {/* ── Preferences ── */}
      <section className="settings-card">
        <div className="settings-card-header">
          <span className="settings-card-icon">⚙️</span>
          <h2>Preferences</h2>
        </div>
        <div className="settings-fields-row">
          <div className="settings-field">
            <label htmlFor="sett-currency">Currency Symbol</label>
            <select id="sett-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="$">$ — US Dollar (USD)</option>
              <option value="£">£ — British Pound (GBP)</option>
              <option value="€">€ — Euro (EUR)</option>
              <option value="₹">₹ — Indian Rupee (INR)</option>
              <option value="¥">¥ — Japanese Yen (JPY)</option>
              <option value="৳">৳ — Bangladeshi Taka (BDT)</option>
              <option value="C$">C$ — Canadian Dollar (CAD)</option>
              <option value="A$">A$ — Australian Dollar (AUD)</option>
            </select>
          </div>
          <div className="settings-field">
            <label htmlFor="sett-date">Date Format</label>
            <select id="sett-date" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              <option value="MMM DD, YYYY">Jan 01, 2025</option>
            </select>
          </div>
        </div>
        {prefMsg && <p className="settings-success">{prefMsg}</p>}
        <button type="button" className="settings-btn" onClick={handlePreferencesSave}>Save Preferences</button>
      </section>

      {/* ── Accessibility ── */}
      <section className="settings-card">
        <div className="settings-card-header">
          <span className="settings-card-icon">♿</span>
          <h2>Accessibility</h2>
        </div>

        {/* Font Size */}
        <div className="settings-field">
          <label>Text Size</label>
          <div className="a11y-option-group">
            {[
              { value: "default", label: "Default" },
              { value: "large",   label: "Large" },
              { value: "xlarge",  label: "Extra Large" },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`a11y-option-btn${a11yFontSize === value ? " active" : ""}`}
                onClick={() => setA11yFontSize(value)}
                style={a11yFontSize === value ? { fontSize: value === "large" ? "1rem" : value === "xlarge" ? "1.1rem" : "0.85rem" } : {}}
              >
                {label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.35rem 0 0" }}>
            Adjusts text size across all app pages.
          </p>
        </div>

        {/* Toggle switches */}
        <div>
          {/* High Contrast */}
          <div className="a11y-toggle-row">
            <div className="a11y-toggle-info">
              <span className="a11y-toggle-label">High Contrast Mode</span>
              <span className="a11y-toggle-desc">Increases text and border contrast for low-vision users.</span>
            </div>
            <label className="a11y-switch" aria-label="Toggle high contrast">
              <input type="checkbox" checked={a11yHighContrast} onChange={(e) => setA11yHighContrast(e.target.checked)} />
              <span className="a11y-switch-slider" />
            </label>
          </div>

          {/* Reduced Motion */}
          <div className="a11y-toggle-row">
            <div className="a11y-toggle-info">
              <span className="a11y-toggle-label">Reduce Motion</span>
              <span className="a11y-toggle-desc">Disables animations and transitions — helpful for motion sensitivity.</span>
            </div>
            <label className="a11y-switch" aria-label="Toggle reduced motion">
              <input type="checkbox" checked={a11yReducedMotion} onChange={(e) => setA11yReducedMotion(e.target.checked)} />
              <span className="a11y-switch-slider" />
            </label>
          </div>

          {/* Enhanced Focus Ring */}
          <div className="a11y-toggle-row">
            <div className="a11y-toggle-info">
              <span className="a11y-toggle-label">Enhanced Focus Indicator</span>
              <span className="a11y-toggle-desc">Shows a bold visible ring around focused elements for keyboard navigation.</span>
            </div>
            <label className="a11y-switch" aria-label="Toggle enhanced focus ring">
              <input type="checkbox" checked={a11yFocusRing} onChange={(e) => setA11yFocusRing(e.target.checked)} />
              <span className="a11y-switch-slider" />
            </label>
          </div>
        </div>

        {a11yMsg && <p className="settings-success" style={{ marginTop: "1rem" }}>{a11yMsg}</p>}
        <button type="button" className="settings-btn" onClick={handleA11ySave} style={{ marginTop: "0.75rem" }}>
          Apply Accessibility Settings
        </button>
      </section>

      {/* ── Danger Zone ── */}
      <section className="settings-card settings-danger-card">
        <div className="settings-card-header">
          <span className="settings-card-icon">⚠️</span>
          <h2>Danger Zone</h2>
        </div>
        <p>
          Permanently delete your account and all associated data — expenses, income,
          receipts, and settings. <strong>This cannot be undone.</strong>
        </p>
        <button type="button" className="settings-btn settings-danger-btn" onClick={() => setShowDeleteModal(true)}>
          Delete My Account
        </button>
      </section>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="settings-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowDeleteModal(false); setDeleteConfirm(""); setDeleteError(""); } }}>
          <div className="settings-modal">
            <div className="settings-modal-icon">⚠️</div>
            <h3>Delete Account?</h3>
            <p>This will permanently erase your account, all expenses, income records, and receipts. There is no way to recover your data.</p>
            <p className="settings-modal-type-hint">Type <strong style={{ color: "#f87171" }}>DELETE</strong> below to confirm:</p>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" autoFocus />
            {deleteError && <p className="settings-error">{deleteError}</p>}
            <div className="settings-modal-actions">
              <button className="settings-btn settings-danger-btn" onClick={handleDeleteAccount} disabled={deleteLoading}>
                {deleteLoading ? "Deleting…" : "Confirm Delete"}
              </button>
              <button className="settings-btn settings-outline-btn" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); setDeleteError(""); }} disabled={deleteLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
