import { spawn } from "child_process";

export function getPythonCmd() {
  return process.platform === "win32" ? "python" : "python3";
}

export function parseJsonFromStdout(stdout) {
  const lines = String(stdout || "").trim().split("\n").filter(Boolean);
  const jsonLine = lines.find((l) => l.startsWith("{") && l.endsWith("}")) || lines[lines.length - 1];
  try {
    return JSON.parse(jsonLine || "{}");
  } catch {
    return {};
  }
}

export function runPython(args, options = {}) {
  const { cwd = process.cwd(), stdin } = options;
  const python = getPythonCmd();
  return new Promise((resolve, reject) => {
    const proc = spawn(python, args, { cwd });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => { stdout += chunk; });
    proc.stderr.on("data", (chunk) => { stderr += chunk; });
    proc.on("error", reject);
    proc.on("close", () => resolve({ stdout, stderr }));
    // Pipe stdin if provided (used by forecast.py)
    if (stdin != null) {
      proc.stdin.write(stdin);
      proc.stdin.end();
    }
  });
}
