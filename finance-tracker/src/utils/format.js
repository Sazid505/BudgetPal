export function getTodayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseLocalYearMonth(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const s = dateStr.trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) return null;
  return { year, monthIndex: month - 1 };
}

export function formatDate(value) {
  if (value == null || value === "") return "—";

  if (typeof value === "string") {
    const s = value.trim();
    const isoLocalMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoLocalMatch) {
      const year = parseInt(isoLocalMatch[1], 10);
      const month = parseInt(isoLocalMatch[2], 10);
      const day = parseInt(isoLocalMatch[3], 10);
      const dLocal = new Date(year, month - 1, day);
      if (!isNaN(dLocal.getTime())) {
        return dLocal.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }
  }

  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
