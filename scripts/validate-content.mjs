#!/usr/bin/env node
// contents/ 아래 글(.mdx)의 구조와 frontmatter, 본문을 검사한다. 규칙은 scripts/content/*.mjs, 테스트는 scripts/content/validate-content.test.mjs.
// 사용법:
//   node scripts/validate-content.mjs                 전체 글 검사
//   node scripts/validate-content.mjs <path>...       지정한 파일만 보고 (contents/ 밖 경로는 무시)
//   node scripts/validate-content.mjs --root <dir>    <dir>/contents 를 검사 (픽스처 테스트용)
//   node scripts/validate-content.mjs --strict        TODO: 를 error 로 본다 (verify 와 CI). 기본은 warn (편집 중 검사)
// 출력: 문제마다 한 줄 `<path>: [error|warn] <message>`. error 가 하나라도 있으면 exit 1. 인자 오류는 exit 2.
// next.config.js 나 languages.ts 를 읽지 못하면 지정 파일과 무관하게 error 로 보고한다.
import path from "node:path";
import { loadContext, real } from "./content/context.mjs";
import { scan } from "./content/scan.mjs";

const argv = process.argv.slice(2);
let rootArg;
let strict = false;
const targets = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--root") rootArg = path.resolve(argv[++i] ?? ".");
  else if (a.startsWith("--root=")) rootArg = path.resolve(a.slice(7));
  else if (a === "--strict") strict = true;
  else if (a.startsWith("--")) {
    console.error(`알 수 없는 옵션: ${a}\n사용법: node scripts/validate-content.mjs [--root <dir>] [--strict] [<path>...]`);
    process.exit(2);
  } else targets.push(a);
}

const ctx = await loadContext(rootArg);
const { problems, posts } = scan(ctx, { strict });
const rel = (p) => path.relative(ctx.root, p).split(path.sep).join("/");
const toLine = (p) => ({ path: rel(p.file), level: p.level, message: p.message });

let reported = problems.map(toLine);
let scope = `글 ${posts.length}개`;
if (targets.length > 0) {
  const wanted = targets
    .map((t) => rel(real(path.resolve(t))))
    .filter((t) => t === "contents" || t.startsWith("contents/"));
  if (wanted.length === 0 && ctx.setupProblems.length === 0) process.exit(0);
  reported = reported.filter((p) => wanted.some((w) => w === p.path || w.startsWith(`${p.path}/`) || p.path.startsWith(`${w}/`)));
  scope = `지정 파일 ${wanted.length}개`;
}
reported.push(...ctx.setupProblems.map(toLine));

const order = { error: 0, warn: 1 };
reported.sort((a, b) => a.path.localeCompare(b.path) || order[a.level] - order[b.level]);
for (const p of reported) console.log(`${p.path}: [${p.level}] ${p.message}`);

const errors = reported.filter((p) => p.level === "error").length;
const warns = reported.length - errors;
console.log(`콘텐츠 검사 (${scope}${strict ? ", strict" : ""}): error ${errors}개, warn ${warns}개${errors ? " → 실패" : ""}`);
process.exit(errors ? 1 : 0);
