// PostToolUse hook: runs Prettier (and ESLint for code files) on the file Claude just wrote.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const CODE = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const FORMAT_ONLY = new Set([".md", ".mdx", ".json"]);

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let input;
try {
  input = JSON.parse(raw);
} catch {
  process.exit(0);
}

const file = input?.tool_input?.file_path ?? input?.tool_response?.filePath;
if (!file) process.exit(0);

const root = path.resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
const abs = path.resolve(root, file);
const rel = path.relative(root, abs);

if (rel.startsWith("..") || path.isAbsolute(rel)) process.exit(0);
if (!existsSync(abs)) process.exit(0);
if (/(^|[\\/])(node_modules|\.next|out|build)[\\/]/.test(rel)) process.exit(0);
if (path.basename(abs) === "package-lock.json") process.exit(0);

const ext = path.extname(abs).toLowerCase();
const isCode = CODE.has(ext);
if (!isCode && !FORMAT_ONLY.has(ext)) process.exit(0);

const run = (bin, args) =>
  spawnSync(process.execPath, [path.join(root, "node_modules", ...bin), ...args], {
    cwd: root,
    encoding: "utf8",
  });

const errors = [];

const prettier = run(["prettier", "bin", "prettier.cjs"], ["--write", abs]);
if (prettier.status !== 0) {
  errors.push(`Prettier failed on ${rel}:\n${prettier.stderr || prettier.stdout}`);
}

if (isCode) {
  const eslint = run(["eslint", "bin", "eslint.js"], ["--fix", abs]);
  if (eslint.status !== 0) {
    errors.push(`ESLint errors in ${rel}:\n${eslint.stdout || eslint.stderr}`);
  }
}

if (errors.length) {
  process.stderr.write(errors.join("\n"));
  process.exit(2);
}
