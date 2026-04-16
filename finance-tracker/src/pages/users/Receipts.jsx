import { useState, useEffect, useRef, useCallback } from "react";
import { formatDate } from "../../utils/format";
import { api, getToken } from "../../utils/api";

const LOCAL_STORAGE_KEY = "receipt_history";

const CATEGORY_COLORS = {
  Food: "#e8f5e9",
  Transportation: "#e3f2fd",
  Healthcare: "#fce4ec",
  Miscellaneous: "#f3e5f5",
  Housing: "#fff3e0",
  Entertainment: "#e0f7fa",
  Shopping: "#fff8e1",
  Personal: "#e8eaf6",
  "Debt Payments": "#ffebee",
  Education: "#e0f2f1",
  Other: "#f5f5f5",
};

const CATEGORY_BADGE_COLORS = {
  Food: "#2e7d32",
  Transportation: "#1565c0",
  Healthcare: "#c2185b",
  Miscellaneous: "#6a1b9a",
  Housing: "#e65100",
  Entertainment: "#00838f",
  Shopping: "#f57f17",
  Personal: "#283593",
  "Debt Payments": "#b71c1c",
  Education: "#00695c",
  Other: "#616161",
};

function loadLocalReceipts() {
  try { return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"); }
  catch { return []; }
}

export function addReceiptToHistory(receipt) {
  const existing = loadLocalReceipts();
  const updated = [receipt, ...existing].slice(0, 100);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
}

function mergeReceipts(backendRows, localList) {
  const localMap = {};
  localList.forEach((r) => {
    if (r.filename && r.imageDataUrl) localMap[r.filename] = r.imageDataUrl;
  });
  return backendRows.map((row) => ({
    id: `db_${row.id}`,
    merchant: row.merchant || "",
    amount: row.amount || "",
    date: row.date || "",
    category: row.category || "Other",
    raw_text: row.raw_text || "",
    filename: row.filename,
    imageDataUrl: localMap[row.filename] || null,
    addedAt: row.created_at || new Date().toISOString(),
  }));
}

const ReceiptCard = ({ receipt, onClick, onDelete }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const bgColor = CATEGORY_COLORS[receipt.category] || CATEGORY_COLORS.Other;
  const badgeColor = CATEGORY_BADGE_COLORS[receipt.category] || CATEGORY_BADGE_COLORS.Other;
  const imgSrc = receipt.imageDataUrl || (receipt.filename ? `http://localhost:3000/uploads/${receipt.filename}` : null);

  const handleDelete = (e) => {
    e.stopPropagation(); // don't open modal
    onDelete(receipt);
  };

  return (
    <div className="rc-card" onClick={() => onClick(receipt)} style={{ background: bgColor }}>
      <div className="rc-card-img">
        {imgSrc && !imgFailed ? (
          <img src={imgSrc} alt="Receipt" onError={() => setImgFailed(true)} />
        ) : (
          <div className="rc-card-no-img">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>No preview</span>
          </div>
        )}
        <button className="rc-card-delete" onClick={handleDelete} title="Delete receipt">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
      <div className="rc-card-body">
        <p className="rc-card-merchant">{receipt.merchant || "Unknown"}</p>
        <p className="rc-card-date">{formatDate(receipt.date) || "—"}</p>
        <p className="rc-card-amount">${parseFloat(receipt.amount || 0).toFixed(2)}</p>
        <span className="rc-badge" style={{ background: badgeColor }}>{receipt.category || "Other"}</span>
      </div>
    </div>
  );
};

const Modal = ({ receipt, onClose }) => {
  if (!receipt) return null;
  const badgeColor = CATEGORY_BADGE_COLORS[receipt.category] || CATEGORY_BADGE_COLORS.Other;
  const imgSrc = receipt.imageDataUrl || (receipt.filename ? `http://localhost:3000/uploads/${receipt.filename}` : null);

  return (
    <div className="rc-overlay" onClick={onClose}>
      <div className="rc-modal" onClick={(e) => e.stopPropagation()}>
        <button className="rc-modal-close" onClick={onClose}>✕</button>
        {imgSrc && (
          <div className="rc-modal-img">
            <img src={imgSrc} alt="Receipt" />
          </div>
        )}
        <div className="rc-modal-details">
          <h2>{receipt.merchant || "Unknown Merchant"}</h2>
          <div className="rc-modal-row"><span>Date</span><span>{formatDate(receipt.date) || "—"}</span></div>
          <div className="rc-modal-row"><span>Amount</span><strong>${parseFloat(receipt.amount || 0).toFixed(2)}</strong></div>
          <div className="rc-modal-row">
            <span>Category</span>
            <span className="rc-badge" style={{ background: badgeColor }}>{receipt.category || "Other"}</span>
          </div>
          <div className="rc-modal-row"><span>Added</span><span>{receipt.addedAt ? new Date(receipt.addedAt).toLocaleString() : "—"}</span></div>
          {receipt.raw_text && (
            <div className="rc-modal-raw">
              <span>OCR Text</span>
              <pre>{receipt.raw_text}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ALL_CATEGORIES = ["All", "Food", "Transportation", "Healthcare", "Miscellaneous", "Housing", "Entertainment", "Shopping", "Personal", "Debt Payments", "Education", "Other"];

const Receipts = ({ refreshExpenses }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const filterRef = useRef(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (getToken()) {
        const res = await api("/api/receipts");
        if (res.ok) {
          const rows = await res.json();
          setReceipts(mergeReceipts(rows, loadLocalReceipts()));
          return;
        }
      }
      setReceipts(loadLocalReceipts());
    } catch {
      setError("Could not load from server. Showing local history.");
      setReceipts(loadLocalReceipts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  // Close dropdown only when clicking outside the filter button area
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = async (receipt) => {
    if (!window.confirm("Delete this receipt? This will also remove the linked expense.")) return;

    const numericId = String(receipt.id).replace("db_", "");

    // Remove from local state immediately
    setReceipts((prev) => prev.filter((r) => r.id !== receipt.id));

    // Remove from localStorage
    const local = loadLocalReceipts().filter((r) => r.filename !== receipt.filename);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));

    // Delete receipt from backend DB + disk, which also deletes linked expense
    if (getToken() && numericId && !isNaN(numericId)) {
      try {
        await api(`/api/receipts/${numericId}`, { method: "DELETE" });
      } catch (_) {}
    }

    // Refresh expenses — double refresh to ensure backend has time to delete linked expense
    setTimeout(() => refreshExpenses?.(), 600);
    setTimeout(() => refreshExpenses?.(), 1500);
  };

  const filtered = receipts.filter((r) => {
    const matchCat = filter === "All" || (r.category || "Other") === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (r.merchant || "").toLowerCase().includes(q) ||
      (r.category || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="rc-page">
      {/* Header */}
      <div className="rc-header">
        <h1 className="rc-title">Receipt Upload History</h1>
        <div className="rc-controls">
          <input
            className="rc-search"
            type="text"
            placeholder="Search merchant or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="rc-filter-wrap" ref={filterRef}>
            <button className="rc-filter-btn" onClick={() => setShowFilter((v) => !v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              {filter !== "All" ? filter : "Filter"}
            </button>
            {showFilter && (
              <div className="rc-dropdown">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={"rc-dropdown-item" + (filter === cat ? " active" : "")}
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent blur closing dropdown before click registers
                      setFilter(cat);
                      setShowFilter(false);
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="rc-error">{error}</p>}
      {!loading && receipts.length > 0 && (
        <p className="rc-count">
          {filtered.length} receipt{filtered.length !== 1 ? "s" : ""}
          {filter !== "All" ? ` · ${filter}` : ""}
          {search ? ` · "${search}"` : ""}
        </p>
      )}

      {/* Body */}
      {loading ? (
        <div className="rc-empty"><p>Loading receipts…</p></div>
      ) : receipts.length === 0 ? (
        <div className="rc-empty">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <h3>No receipts yet</h3>
          <p>Upload a receipt from the Dashboard to see it here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rc-empty">
          <h3>No matches</h3>
          <p>Try a different filter or search term.</p>
        </div>
      ) : (
        <div className="rc-grid">
          {filtered.map((r) => (
            <ReceiptCard key={r.id} receipt={r} onClick={setSelected} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <Modal receipt={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Receipts;
