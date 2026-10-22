#!/usr/bin/env node
// 배포 전 전체 검증. 모든 단계를 운영 DB 차단 환경에서 순서대로 실행하고 첫 실패에서 멈춘다.
// 사용법: node scripts/verify.mjs   (npm run verify)
//   prisma generate → tsc --noEmit → eslint . → 콘텐츠 검사 → next build → smoke
import { spawnSync } from "node:child_process";
import { ROOT, blockedEnv, resolveBin } from "./with-blocked-db.mjs";

const node = process.execPath;
const steps = [
  { name: "prisma generate", cmd: resolveBin("prisma"), args: ["generate"] },
  { name: "tsc --noEmit", cmd: resolveBin("tsc"), args: ["--noEmit"] },
  { name: "eslint .", cmd: resolveBin("eslint"), args: ["."] },
  { name: "content:check", cmd: node, args: ["scripts/validate-content.mjs"] },
  { name: "next build (blocked DB)", cmd: resolveBin("next"), args: ["build"] },
  { name: "smoke", cmd: node, args: ["scripts/smoke.mjs"] },
];

const env = blockedEnv();
const results = [];
const total = Date.now();

for (const step of steps) {
  console.log(`\n▶ [${results.length + 1}/${steps.length}] ${step.name}`);
  const t0 = Date.now();
  const { status, signal, error } = spawnSync(step.cmd, step.args, { cwd: ROOT, env, stdio: "inherit" });
  const ok = status === 0;
  results.push({ name: step.name, ok, sec: (Date.now() - t0) / 1000 });
  if (!ok) {
    const why = error ? error.message : signal ? `signal ${signal}` : `exit ${status}`;
    console.error(`✖ ${step.name} 실패 (${why})`);
    break;
  }
}

console.log("\n── verify 요약 ──");
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(22)} ${r.sec.toFixed(1)}s`);
for (const s of steps.slice(results.length)) console.log(`SKIP  ${s.name}`);
const passed = results.length === steps.length && results.every((r) => r.ok);
console.log(`${passed ? "통과" : "실패"} (총 ${((Date.now() - total) / 1000).toFixed(1)}s)`);
process.exit(passed ? 0 : 1);
