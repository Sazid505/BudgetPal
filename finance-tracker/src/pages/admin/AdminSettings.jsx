import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Auto-clearing message hook ──
function useMsg() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const show = (type, text) => {
    clearTimeout(timer.current);
    setMsg({ type, text });
    timer.current = setTimeout(() => setMsg(null), 4000);
  };
  return [msg, show];
}

// ── Password strength ──
function scorePassword(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

// ── Convert array of objects to downloadable CSV ──
function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = r[h] == null ? "" : String(r[h]);
        // Wrap in quotes if contains comma, newline, or quote
        return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(",")
    )
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const AdminSettings = ({ user, setUser }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // ── Platform overview ──
  const [stats, setStats] = useState(null);

  // ── Signup lock ──
  const [signupLocked, setSignupLocked]   = useState(false);
  const [lockLoading, setLockLoading]     = useState(false);
  const [lockMsg, showLockMsg]             = useMsg();

  // ── User role manager ──
  const [allUsers, setAllUsers]           = useState([]);
  const [usersLoading, setUsersLoading]   = useState(true);
  const [roleMsg, showRoleMsg]             = useMsg();
  const [userSearch, setUserSearch]       = useState("");

  // ── CSV export ──
  const [exportLoading, setExportLoading] = useState({});
  const [exportMsg, showExportMsg]         = useMsg();

  // ── Profile ──
  const [name, setName]   = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMsg, showProfileMsg] = useMsg();

  // ── Password ──
  const [currentPw, setCurrentPw]     = useState("");
  const [newPw, setNewPw]             = useState("");
  const [confirmPw, setConfirmPw]     = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwMsg, showPwMsg]             = useMsg();
  const strength = scorePassword(newPw);

  // ── Delete ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm]     = useState("");
  const [deleteMsg, showDeleteMsg]             = useMsg();

  // ── Load everything on mount ──
  useEffect(() => {
    // Platform stats
    fetch("/api/auth/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setStats).catch(() => {});

    // Signup lock state
    fetch("/api/auth/signup-lock", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => setSignupLocked(d.locked ?? false)).catch(() => {});

    // All users
    fetch("/api/auth/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setAllUsers(Array.isArray(d) ? d : []); setUsersLoading(false); })
      .catch(() => setUsersLoading(false));
  }, []);

  // ════════════════════════════════════════
  //  FEATURE 1 — SIGNUP LOCK
  // ════════════════════════════════════════
  const handleToggleLock = async () => {
    setLockLoading(true);
    try {
      const res = await fetch("/api/auth/signup-lock", {
        method: "PUT", headers,
        body: JSON.stringify({ locked: !signupLocked })
      });
      const data = await res.json();
      if (!res.ok) return showLockMsg("error", data.error || "Failed.");
      setSignupLocked(data.locked);
      showLockMsg("success", data.message);
    } catch { showLockMsg("error", "Network error."); }
    finally { setLockLoading(false); }
  };

  // ════════════════════════════════════════
  //  FEATURE 2 — CSV EXPORT
  // ════════════════════════════════════════
  const handleExport = async (type) => {
    setExportLoading((p) => ({ ...p, [type]: true }));
    try {
      let endpoint = "";
      if (type === "users")    endpoint = "/api/auth/users";
      if (type === "expenses") endpoint = "/api/expenses/all";
      if (type === "receipts") endpoint = "/api/receipts/all";

      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) return showExportMsg("error", "Failed to fetch data.");

      // Clean up keys for readability
      const cleaned = data.map((row) => {
        const out = {};
        Object.entries(row).forEach(([k, v]) => {
          out[k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())] =
            v instanceof Date ? v.toISOString().slice(0, 10) : (v ?? "");
        });
        return out;
      });

      downloadCSV(`budgetpal_${type}_${new Date().toISOString().slice(0, 10)}.csv`, cleaned);
      showExportMsg("success", `${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully.`);
    } catch { showExportMsg("error", "Export failed."); }
    finally { setExportLoading((p) => ({ ...p, [type]: false })); }
  };

  // ════════════════════════════════════════
  //  FEATURE 4 — USER ROLE MANAGER
  // ════════════════════════════════════════
  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`/api/auth/users/${userId}/role`, {
        method: "PUT", headers, body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) return showRoleMsg("error", data.error || "Failed.");
      setAllUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      showRoleMsg("success", `User promoted to ${newRole}.`);
    } catch { showRoleMsg("error", "Network error."); }
  };

  const filteredUsers = userSearch.trim()
    ? allUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase())
      )
    : allUsers;

  // ════════════════════════════════════════
  //  PROFILE + PASSWORD (existing)
  // ════════════════════════════════════════
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return showProfileMsg("error", "Name and email cannot be empty.");
    try {
      const res = await fetch("/api/auth/profile", { method: "PUT", headers, body: JSON.stringify({ name: name.trim(), email: email.trim() }) });
      const data = await res.json();
      if (!res.ok) return showProfileMsg("error", data.error || "Update failed.");
      const updated = { ...user, name: name.trim(), email: email.trim() };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      showProfileMsg("success", "Profile updated.");
    } catch { showProfileMsg("error", "Network error."); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) return showPwMsg("error", "All fields are required.");
    if (newPw.length < 6) return showPwMsg("error", "New password must be at least 6 characters.");
    if (newPw !== confirmPw) return showPwMsg("error", "Passwords do not match.");
    try {
      const res = await fetch("/api/auth/password", { method: "PUT", headers, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) });
      const data = await res.json();
      if (!res.ok) return showPwMsg("error", data.error || "Failed.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      showPwMsg("success", "Password changed.");
    } catch { showPwMsg("error", "Network error."); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return showDeleteMsg("error", "Type DELETE to confirm.");
    try {
      const res = await fetch("/api/auth/delete", { method: "DELETE", headers });
      if (!res.ok) return showDeleteMsg("error", "Failed.");
      localStorage.removeItem("token"); localStorage.removeItem("user");
      setUser(null); navigate("/login");
    } catch { showDeleteMsg("error", "Network error."); }
  };

  // ── Helpers ──
  const Msg = ({ m }) => m ? <div className={`admin-settings-msg ${m.type}`}>{m.text}</div> : null;

  return (
    <div className="admin-settings-page">
      <h1 className="admin-settings-title">Admin Settings</h1>

      <div className="admin-settings-grid">

        {/* ── LEFT COLUMN ── */}
        <div className="admin-settings-col">

          {/* Platform Overview */}
          <div className="admin-settings-card">
            <h2 className="admin-settings-section-title">Platform Overview</h2>
            <p className="admin-settings-section-desc">Live snapshot of platform activity.</p>
            <div className="admin-overview-grid">
              {[
                { label: "Total Users",      value: stats?.totalUsers    ?? "…" },
                { label: "Active (15 min)",  value: stats?.activeUsers   ?? "…" },
                { label: "Total Expenses",   value: stats?.totalExpenses ?? "…" },
                { label: "Total Receipts",   value: stats?.totalReceipts ?? "…" },
              ].map(({ label, value }) => (
                <div className="admin-overview-item" key={label}>
                  <span className="admin-overview-label">{label}</span>
                  <span className="admin-overview-value">{typeof value === "number" ? value.toLocaleString() : value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Registration Control */}
          <div className="admin-settings-card">
            <div className="admin-feature-header">
              <div>
                <h2 className="admin-settings-section-title">Registration Control</h2>
                <p className="admin-settings-section-desc">
                  Block or allow new users from creating accounts. Useful during maintenance or when the platform is at capacity.
                </p>
              </div>
              <button
                className={`admin-lock-toggle ${signupLocked ? "locked" : "open"}`}
                onClick={handleToggleLock}
                disabled={lockLoading}
              >
                <span className="admin-lock-thumb" />
              </button>
            </div>
            <div className={`admin-lock-status ${signupLocked ? "locked" : "open"}`}>
              {signupLocked
                ? "🔒 Signups are DISABLED — new users cannot register."
                : "🟢 Signups are ENABLED — new users can register freely."}
            </div>
            <Msg m={lockMsg} />
          </div>

          {/* Export Platform Data */}
          <div className="admin-settings-card">
            <h2 className="admin-settings-section-title">Export Platform Data</h2>
            <p className="admin-settings-section-desc">
              Download a snapshot of all platform data as CSV. Files are generated instantly from live database records.
            </p>
            <Msg m={exportMsg} />
            <div className="admin-export-grid">
              {[
                { key: "users",    icon: "👥", label: "All Users",    desc: "Names, emails, roles, join dates" },
                { key: "expenses", icon: "💸", label: "All Expenses",  desc: "Every expense across all users" },
                { key: "receipts", icon: "🧾", label: "All Receipts",  desc: "OCR receipt data with user info" },
              ].map(({ key, icon, label, desc }) => (
                <div key={key} className="admin-export-card">
                  <span className="admin-export-icon">{icon}</span>
                  <div className="admin-export-info">
                    <span className="admin-export-label">{label}</span>
                    <span className="admin-export-desc">{desc}</span>
                  </div>
                  <button
                    className="admin-export-btn"
                    onClick={() => handleExport(key)}
                    disabled={exportLoading[key]}
                  >
                    {exportLoading[key] ? "…" : "⬇ CSV"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="admin-settings-card admin-danger-card">
            <h2 className="admin-settings-section-title danger">Danger Zone</h2>
            <p className="admin-settings-section-desc">Permanently delete this admin account. This cannot be undone.</p>
            <Msg m={deleteMsg} />
            <button type="button" className="admin-settings-btn danger" onClick={() => setShowDeleteModal(true)}>
              Delete Admin Account
            </button>
          </div>

        </div>{/* end LEFT COLUMN */}

        {/* ── RIGHT COLUMN ── */}
        <div className="admin-settings-col">

          {/* User Role Manager */}
          <div className="admin-settings-card">
            <h2 className="admin-settings-section-title">User Role Manager</h2>
            <p className="admin-settings-section-desc">
              Promote users to admin or demote admins back to regular users. You cannot change your own role.
            </p>
            <Msg m={roleMsg} />
            <div className="admin-search-wrap" style={{ marginBottom: "1rem", maxWidth: "340px" }}>
              <span className="admin-search-icon">🔍</span>
              <input
                className="admin-search-input"
                type="text"
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              {userSearch && <button className="admin-search-clear" onClick={() => setUserSearch("")}>✕</button>}
            </div>
            {usersLoading ? (
              <p className="admin-empty">Loading users…</p>
            ) : (
              <div className="admin-role-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>No users found.</td></tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td className="admin-muted">{u.email}</td>
                          <td>
                            <span className={`admin-role-badge ${u.role}`}>{u.role}</span>
                          </td>
                          <td>
                            {u.id === user?.id ? (
                              <span className="admin-muted" style={{ fontSize: "0.8rem" }}>You</span>
                            ) : (
                              <button
                                className={`admin-role-toggle-btn ${u.role === "admin" ? "demote" : "promote"}`}
                                onClick={() => handleRoleToggle(u.id, u.role)}
                              >
                                {u.role === "admin" ? "Demote" : "Promote"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Admin Profile */}
          <div className="admin-settings-card">
            <h2 className="admin-settings-section-title">Admin Profile</h2>
            <p className="admin-settings-section-desc">Update your display name and email address.</p>
            <Msg m={profileMsg} />
            <form className="admin-settings-form" onSubmit={handleProfileSave}>
              <div className="admin-settings-field">
                <label>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Admin name" />
              </div>
              <div className="admin-settings-field">
                <label>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
              </div>
              <button type="submit" className="admin-settings-btn">Save Profile</button>
            </form>
          </div>

          {/* Change Password */}
          <div className="admin-settings-card admin-compact">
            <h2 className="admin-settings-section-title">Change Password</h2>
            <p className="admin-settings-section-desc">Keep your admin account secure with a strong password.</p>
            <Msg m={pwMsg} />
            <form className="admin-settings-form" onSubmit={handlePasswordSave}>
              <div className="admin-settings-field">
                <label>Current Password</label>
                <div className="admin-pw-wrap">
                  <input type={showCurrent ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Current password" />
                  <button type="button" className="admin-pw-eye" onClick={() => setShowCurrent((p) => !p)}>{showCurrent ? "🙈" : "👁️"}</button>
                </div>
              </div>
              <div className="admin-settings-field">
                <label>New Password</label>
                <div className="admin-pw-wrap">
                  <input type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 6 characters" />
                  <button type="button" className="admin-pw-eye" onClick={() => setShowNew((p) => !p)}>{showNew ? "🙈" : "👁️"}</button>
                </div>
                {newPw && (
                  <div className="admin-pw-strength">
                    <div className="admin-pw-bars">
                      {[1,2,3,4].map((n) => (
                        <div key={n} className="admin-pw-bar" style={{ background: strength >= n ? STRENGTH_COLOR[strength] : "var(--border)" }} />
                      ))}
                    </div>
                    <span style={{ color: STRENGTH_COLOR[strength], fontSize: "0.78rem" }}>{STRENGTH_LABEL[strength]}</span>
                  </div>
                )}
              </div>
              <div className="admin-settings-field">
                <label>Confirm New Password</label>
                <div className="admin-pw-wrap">
                  <input type={showConfirm ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repeat new password" />
                  <button type="button" className="admin-pw-eye" onClick={() => setShowConfirm((p) => !p)}>{showConfirm ? "🙈" : "👁️"}</button>
                </div>
                {confirmPw && (
                  <span style={{ fontSize: "0.78rem", color: newPw === confirmPw ? "#22c55e" : "#ef4444" }}>
                    {newPw === confirmPw ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </span>
                )}
              </div>
              <button type="submit" className="admin-settings-btn">Change Password</button>
            </form>
          </div>

        </div>{/* end RIGHT COLUMN */}

      </div>{/* end admin-settings-grid */}

      {/* ── Delete modal ── */}
      {showDeleteModal && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Admin Account</h3>
            <p>Type <strong>DELETE</strong> to permanently remove this account.</p>
            <Msg m={deleteMsg} />
            <input
              type="text" className="admin-modal-input"
              placeholder="Type DELETE to confirm"
              value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
            />
            <div className="admin-modal-actions">
              <button className="admin-modal-cancel" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>Cancel</button>
              <button className="admin-modal-confirm" onClick={handleDeleteAccount} disabled={deleteConfirm !== "DELETE"}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
