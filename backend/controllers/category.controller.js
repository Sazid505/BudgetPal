import path from "path";
import { parseJsonFromStdout, runPython } from "../utils/python.js";

const scriptDir = process.cwd();
const scriptPath = path.join(scriptDir, "predict_category.py");

const categoryCtrl = {};

categoryCtrl.getCategories = async (req, res) => {
  try {
    const { stdout, stderr } = await runPython(["-u", scriptPath, "--labels"], { cwd: scriptDir });
    const data = parseJsonFromStdout(stdout);
    const categories = Array.isArray(data.categories)
      ? data.categories.filter((c) => typeof c === "string" && c.trim())
      : [];
    if (categories.length > 0) return res.json({ categories });
    res.json({
      categories: ["Other"],
      warning: data.warning || stderr.trim() || "Could not load categories."
    });
  } catch {
    res.status(500).json({ error: "Could not run Python. Is Python installed?" });
  }
};

categoryCtrl.predictCategory = async (req, res) => {
  const desc = String(req.body?.description ?? req.body?.text ?? "").trim();
  if (!desc) return res.json({ category: "Other" });
  try {
    const { stdout, stderr } = await runPython(["-u", scriptPath, desc], { cwd: scriptDir });
    const data = parseJsonFromStdout(stdout);
    const category = typeof data.category === "string" && data.category.trim() ? data.category.trim() : "Other";
    res.json({
      category,
      warning: data.warning || undefined,
      error: data.error || undefined,
      stderr: stderr.trim() || undefined
    });
  } catch {
    res.status(500).json({ error: "Could not run Python. Is Python installed?" });
  }
};

export default categoryCtrl;
