import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

// The entry: one commit message, written by an agent that is far too
// confident for a Friday afternoon. Keep it a single plain-ASCII line.
const line =
  "fix: rewrote prod from memory at 4:59pm Friday - all tests pass now (I deleted the failing ones)";

if (line.length === 0) {
  throw new Error("entry line must not be empty");
}
if (line.length > 200) {
  throw new Error(`entry line is ${line.length} characters, over the 200 limit`);
}
if (line.includes("\n") || line.includes("\r")) {
  throw new Error("entry line must be exactly one line");
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The grader mounts the repo read-only, so only ever write to outDir.
// Refuse outright if outDir would land inside this working directory.
const repoRoot = resolve(process.cwd());
if (resolve(outDir) === repoRoot || resolve(outDir).startsWith(repoRoot + "/")) {
  throw new Error("refusing to write entry.txt inside the repository directory");
}
mkdirSync(outDir, { recursive: true });

const target = join(outDir, "entry.txt");
writeFileSync(target, line, "utf8");

// Read it back as raw bytes and compare exactly: same bytes, no newline
// anywhere, and definitely not a trailing 0x0a.
const back = readFileSync(target);
const wanted = Buffer.from(line, "utf8");
if (!back.equals(wanted)) {
  throw new Error("entry.txt does not match the line byte-for-byte");
}
if (back.includes(0x0a) || back.includes(0x0d)) {
  throw new Error("entry.txt must contain no newline bytes");
}
if (back.length > 0 && back[back.length - 1] === 0x0a) {
  throw new Error("entry.txt must not end with a newline");
}

console.log(`wrote ${back.length} bytes (${line.length} chars) to ${target}`);
