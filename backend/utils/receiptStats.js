import fs from "fs";
import path from "path";

function uploadsDir() {
  return path.join(process.cwd(), "uploads");
}

export function getStoredReceiptCount() {
  try {
    const dir = uploadsDir();
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter((f) => f.startsWith("receipt_")).length;
  } catch {
    return 0;
  }
}
