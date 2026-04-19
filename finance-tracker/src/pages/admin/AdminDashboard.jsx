import { useState, useEffect } from "react";

const AdminDashboard = () => {
  // We are fetching total users and active users stats from the backend.
  const [stats, setStats] = useState({ totalUsers: null, activeUsers: null });
  // Storing all receipts fetched from the backend.
  const [receipts, setReceipts] = useState([]);
  // Storing all expenses fetched from the backend.
  const [expenses, setExpenses] = useState([]);
  // We also track loading and error states to provide feedback to the admin like if the data is still being fetched or if there was an error during the fetch.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Track which table tab is active: "expenses" or "receipts"
  const [activeTab, setActiveTab] = useState("expenses");
  // Search query typed by the admin to filter rows by user name or email.
  const [search, setSearch] = useState("");

  // Fetching stats from the backend when the AdminDashboard first appears on the screen.
  useEffect(() => {
    // Getting the JWT token from the frontend local storage and storing it in a variable.
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // Sending a GET request to the backend API endpoint to fetch the stats data we also provide the JWT token to the backend for authentication.
    fetch("/api/auth/stats", { headers })
      // Reading the response from the backend and converting it to JSON format also we are checking if the response is successful or there was an error.
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      // If the response is not successful we throw an error with the message from the backend or a default error message.
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Failed to load stats");
        // If the response is successful we update the stats state with the data we received from the backend or default to 0 if the data is missing.
        setStats({ totalUsers: data.totalUsers ?? 0, activeUsers: data.activeUsers ?? 0 });
      })
      // If an error occurs during the process we catch it and store the error message in the error state to display it to the admin.
      .catch((err) => setError(err.message))
      // Setting the Loading state to false after fetching the data to indicate that the Loading of stats is complete and we can display the data.
      .finally(() => setLoading(false));

    // Sending a GET request to fetch all receipts uploaded by all users.
    fetch("/api/receipts/all", { headers })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => { if (ok && Array.isArray(data)) setReceipts(data); })
      .catch((err) => console.error("Failed to load receipts:", err));

    // Sending a GET request to fetch all expenses recorded by all users.
    fetch("/api/expenses/all", { headers })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => { if (ok && Array.isArray(data)) setExpenses(data); })
      .catch((err) => console.error("Failed to load expenses:", err));
  }, []);

  // Format a date string nicely, falling back gracefully if invalid.
  const fmtDate = (d) => {
    if (!d) return "—";
    const parsed = new Date(d);
    return isNaN(parsed) ? d : parsed.toLocaleDateString();
  };

  // Format currency with $ sign and 2 decimal places.
  const fmtAmount = (a) => {
    const n = parseFloat(a);
    return isNaN(n) ? "—" : `$${n.toFixed(2)}`;
  };

  // Filter rows by matching the search term against user name, email, or description/merchant.
  // This runs on the already-fetched data entirely on the frontend — no extra API call needed.
  const q = search.trim().toLowerCase();
  const filteredExpenses = q
    ? expenses.filter(
        (e) =>
          (e.user_name || "").toLowerCase().includes(q) ||
          (e.user_email || "").toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q) ||
          (e.category || "").toLowerCase().includes(q)
      )
    : expenses;

  const filteredReceipts = q
    ? receipts.filter(
        (r) =>
          (r.user_name || "").toLowerCase().includes(q) ||
          (r.user_email || "").toLowerCase().includes(q) ||
          (r.merchant || "").toLowerCase().includes(q)
      )
    : receipts;

  // If the data is still being loaded we display a Loading message to the admin.
  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-dashboard">
          <div className="admin-stat-card"><h2>Total Users</h2><p>Loading...</p></div>
          <div className="admin-stat-card"><h2>Active Users</h2><p>Loading...</p></div>
          <div className="admin-stat-card"><h2>Total Receipts</h2><p>Loading...</p></div>
          <div className="admin-stat-card"><h2>Total Expenses</h2><p>Loading...</p></div>
        </div>
      </div>
    );
  }

  // If there was an error during the fetch we display the error message to the admin.
  if (error) {
    return (
      <div className="admin-page">
        <div style={{ color: "var(--error)", padding: "1rem" }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* ── Stat Cards ── */}
      <div className="admin-dashboard">
        <div className="admin-stat-card">
          <h2>Total Users</h2>
          {/*Converting the backend data to a number type and formatting it*/}
          <p>{Number(stats.totalUsers).toLocaleString()}</p>
        </div>
        <div className="admin-stat-card">
          <h2>Active Users</h2>
          {/*Converting the backend data to a number type and formatting it*/}
          <p>{Number(stats.activeUsers).toLocaleString()}</p>
        </div>
        <div className="admin-stat-card">
          <h2>Total Receipts</h2>
          {/*Using the length of the receipts array fetched from the backend*/}
          <p>{receipts.length.toLocaleString()}</p>
        </div>
        <div className="admin-stat-card">
          <h2>Total Expenses</h2>
          {/*Using the length of the expenses array fetched from the backend*/}
          <p>{expenses.length.toLocaleString()}</p>
        </div>
      </div>

      {/* ── Table Section ── */}
      <div className="admin-table-section">

        {/* ── Tabs + Search bar in the same row ── */}
        <div className="admin-tabs-row">
          <div className="admin-tabs">
            <button
              className={`admin-tab${activeTab === "expenses" ? " active" : ""}`}
              onClick={() => { setActiveTab("expenses"); setSearch(""); }}
            >
              All Expenses ({expenses.length})
            </button>
            <button
              className={`admin-tab${activeTab === "receipts" ? " active" : ""}`}
              onClick={() => { setActiveTab("receipts"); setSearch(""); }}
            >
              All Receipts ({receipts.length})
            </button>
          </div>

          {/* Search input — filters the active table by user name, email, or description */}
          <div className="admin-search-wrap">
            <span className="admin-search-icon">🔍</span>
            <input
              className="admin-search-input"
              type="text"
              placeholder="Search by user, email, or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* Clear button — only shown when there is text in the search box */}
            {search && (
              <button className="admin-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
        </div>

        {/* ── Result count hint when searching ── */}
        {q && (
          <div className="admin-search-hint">
            {activeTab === "expenses"
              ? `${filteredExpenses.length} of ${expenses.length} expenses match "${search}"`
              : `${filteredReceipts.length} of ${receipts.length} receipts match "${search}"`}
          </div>
        )}

        {/* ── Expenses Table ── */}
        {activeTab === "expenses" && (
          <div className="admin-table-wrapper">
            {filteredExpenses.length === 0 ? (
              <p className="admin-empty">
                {q ? `No expenses found for "${search}".` : "No expenses recorded yet."}
              </p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((e, i) => (
                    <tr key={e.id}>
                      <td>{i + 1}</td>
                      <td>{e.user_name || "—"}</td>
                      <td className="admin-muted">{e.user_email || "—"}</td>
                      <td>{e.description || "—"}</td>
                      <td>
                        <span className="admin-badge">{e.category || "Other"}</span>
                      </td>
                      <td className="admin-amount">{fmtAmount(e.amount)}</td>
                      <td className="admin-muted">{fmtDate(e.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Receipts Table ── */}
        {activeTab === "receipts" && (
          <div className="admin-table-wrapper">
            {filteredReceipts.length === 0 ? (
              <p className="admin-empty">
                {q ? `No receipts found for "${search}".` : "No receipts uploaded yet."}
              </p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Merchant</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i + 1}</td>
                      <td>{r.user_name || "—"}</td>
                      <td className="admin-muted">{r.user_email || "—"}</td>
                      <td>{r.merchant || "—"}</td>
                      <td className="admin-amount">{fmtAmount(r.amount)}</td>
                      <td className="admin-muted">{fmtDate(r.date)}</td>
                      <td className="admin-muted">{fmtDate(r.uploaded_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
