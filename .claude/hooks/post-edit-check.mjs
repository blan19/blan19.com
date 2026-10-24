#!/usr/bin/env node
// PostToolUse(Edit|Write|MultiEdit) 훅: 방금 수정한 파일 하나만 빠르게 검사한다.
// - .ts/.tsx/.js/.jsx/.mjs/.cjs → ESLint. error 면 exit 2 + stderr (Claude 가 보고 고친다).
//   제외 대상(.next, src/generated 등)은 eslint.config.mjs 의 ignore 한 곳에서 정한다(--no-warn-ignored 로 조용히 통과).
// - contents/**/*.mdx → scripts/validate-content.mjs. error 면 exit 2.
// - warning 만 있으면 exit 0 + additionalContext 로 알려준다. 그 외 파일은 바로 exit 0.
// 타입 검사(tsc)는 느려서 여기서 하지 않는다 → npm run typecheck / npm run verify.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const PROJECT_DIR = path.resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
const TIMEOUT_MS = 40_000;
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const context = (text) =>
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: text } }));

const run = (cmd, args) => spawnSync(cmd, args, { cwd: PROJECT_DIR, encoding: "utf8", timeout: TIMEOUT_MS });

const main = () => {
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return 0;
  }
  const filePath = input?.tool_input?.file_path;
  if (typeof filePath !== "string" || !filePath) return 0;

  const abs = path.resolve(PROJECT_DIR, filePath);
  const rel = path.relative(PROJECT_DIR, abs).split(path.sep).join("/");
  if (rel.startsWith("..") || path.isAbsolute(rel) || !existsSync(abs)) return 0;

  const ext = path.extname(rel);

  if (CODE_EXT.has(ext)) {
    const eslint = path.join(PROJECT_DIR, "node_modules", ".bin", "eslint");
    if (!existsSync(eslint)) return 0;
    const r = run(eslint, ["--no-warn-ignored", "--format", "stylish", rel]);
    const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
    if (r.status === 1) {
      process.stderr.write(`[post-edit-check] ESLint 오류: ${rel}\n${out}\n위 오류를 고쳐 주세요. (전체 검사: npm run lint)\n`);
      return 2;
    }
    if (r.status === 0 && out) context(`[post-edit-check] ESLint 경고: ${rel}\n${out}`);
    return 0; // exit 2(설정 오류)나 시간 초과는 편집을 막지 않는다.
  }

  if (ext === ".mdx" && rel.startsWith("contents/")) {
    const r = run(process.execPath, [path.join(PROJECT_DIR, "scripts", "validate-content.mjs"), rel]);
    const out = (r.stdout ?? "").trim();
    if (r.status === 1) {
      process.stderr.write(`[post-edit-check] 콘텐츠 검사 실패: ${rel}\n${out}\n규칙은 scripts/content/*.mjs 참고.\n`);
      return 2;
    }
    if (r.status === 0 && /\[warn\]/.test(out)) context(`[post-edit-check] 콘텐츠 경고: ${rel}\n${out}`);
    return 0;
  }

  return 0;
};

let code = 0;
try {
  code = main();
} catch {
  code = 0;
}
process.exit(code);
