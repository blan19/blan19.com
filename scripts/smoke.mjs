#!/usr/bin/env node
// 프로덕션 빌드(.next)를 운영 DB 차단 환경에서 `next start` 로 띄우고 주요 라우트를 요청한다.
// 사용법: node scripts/smoke.mjs   (먼저 npm run verify 또는 node scripts/with-blocked-db.mjs next build 로 빌드)
// DB 를 쓰는 부분은 127.0.0.1:1 에서 즉시 실패하는 것이 정상이며 HTTP 상태는 200 이어야 한다.
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { ROOT, BLOCKED_DB_URL, blockedEnv, resolveBin } from "./with-blocked-db.mjs";

const READY_TIMEOUT_MS = 60_000;
const REQUEST_TIMEOUT_MS = 30_000;
const KILL_GRACE_MS = 5_000;
const LOG_FILE = path.join(os.tmpdir(), "blan19-smoke-server.log");

if (!fs.existsSync(path.join(ROOT, ".next", "BUILD_ID"))) {
  console.error("[smoke] .next 프로덕션 빌드가 없습니다. 먼저 `npm run verify` 또는 `node scripts/with-blocked-db.mjs next build` (DB 차단 빌드) 를 실행하세요.");
  process.exit(1);
}

const freePort = () =>
  new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });

const techSlugs = () => {
  const dir = path.join(ROOT, "contents", "tech");
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => fs.readdirSync(path.join(dir, d.name)).filter((f) => f.endsWith(".mdx")))
    .map((f) => f.replace(/\.mdx$/, ""));
};

const HTML = /text\/html/;
const XML = /xml/;
const checks = [
  { path: "/", type: HTML },
  { path: "/tech", type: HTML },
  { path: "/tech?tag=react.js", type: HTML },
  { path: "/tech?tag=__none__", type: HTML },
  { path: "/log", type: HTML },
  ...techSlugs().map((slug) => ({ path: `/tech/${encodeURIComponent(slug)}`, type: HTML })),
  { path: "/rss.xml", type: XML },
  { path: "/rss-atom.xml", type: XML },
  { path: "/sitemap.xml", type: XML },
  { path: "/robots.txt", type: /text\/plain/ },
  { path: "/og", type: /image\/png/ },
  { path: "/og?title=smoke", type: /image\/png/ },
  { path: "/__smoke-not-found__", status: 404, type: HTML },
];

let server = null;
let serverLog = "";

const stopServer = async () => {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  const exited = new Promise((resolve) => server.once("exit", resolve));
  // detached 로 띄웠으므로 프로세스 그룹 전체(wrapper + next)를 종료한다.
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    server.kill("SIGTERM");
  }
  const timer = setTimeout(() => {
    try {
      process.kill(-server.pid, "SIGKILL");
    } catch {
      server.kill("SIGKILL");
    }
  }, KILL_GRACE_MS);
  await exited;
  clearTimeout(timer);
};

const onSignal = (signal) => {
  stopServer().finally(() => process.exit(signal === "SIGINT" ? 130 : 143));
};
process.on("SIGINT", onSignal);
process.on("SIGTERM", onSignal);
process.on("SIGHUP", onSignal);

const fetchWithTimeout = async (url, ms) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { redirect: "manual", signal: controller.signal });
    await res.arrayBuffer();
    return res;
  } finally {
    clearTimeout(timer);
  }
};

const waitForReady = async (base) => {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`서버가 시작 중 종료됨 (exit ${server.exitCode})`);
    try {
      const res = await fetchWithTimeout(`${base}/robots.txt`, 2_000);
      if (res.status === 200) return;
    } catch {
      // 아직 준비 안 됨
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`${READY_TIMEOUT_MS / 1000}초 안에 서버가 준비되지 않음`);
};

// 서버 로그의 ⨯ 오류 중 차단 주소(127.0.0.1:1) 접속 실패만 정상으로 보고, 그 외 오류는 실패로 본다.
const analyzeLog = (log) => {
  const blocks = log.split(/\n(?=\s*⨯)/).filter((b) => b.trimStart().startsWith("⨯"));
  const blocked = (b) => /127\.0\.0\.1:1\b/.test(b) && /P1001|DatabaseNotReachable|ECONNREFUSED|reach database/.test(b);
  return { dbErrors: blocks.filter(blocked).length, otherErrors: blocks.filter((b) => !blocked(b)) };
};

const main = async () => {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const env = blockedEnv();

  console.log(`[smoke] next start (port ${port}, DB 차단: POSTGRES_PRISMA_URL=${env.POSTGRES_PRISMA_URL === BLOCKED_DB_URL ? "blocked" : "?"})`);
  server = spawn(resolveBin("next"), ["start", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: ROOT,
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (d) => (serverLog += d));
  server.stderr.on("data", (d) => (serverLog += d));

  const started = Date.now();
  await waitForReady(base);
  console.log(`[smoke] 준비 완료 (${((Date.now() - started) / 1000).toFixed(1)}s)\n`);

  const results = [];
  for (const check of checks) {
    const expectStatus = check.status ?? 200;
    const t0 = Date.now();
    let status = "-";
    let type = "-";
    let ok = false;
    let note = "";
    try {
      const res = await fetchWithTimeout(base + check.path, REQUEST_TIMEOUT_MS);
      status = res.status;
      type = (res.headers.get("content-type") ?? "").split(";")[0];
      ok = status === expectStatus && check.type.test(type);
      if (!ok) note = `기대: ${expectStatus} ${check.type.source}`;
    } catch (e) {
      note = e.name === "AbortError" ? "시간 초과" : e.message;
    }
    results.push({ ok, path: check.path, status, type, ms: Date.now() - t0, note });
  }

  // 로그가 마저 흘러나오도록 잠깐 기다린다.
  await new Promise((r) => setTimeout(r, 500));
  const { dbErrors, otherErrors } = analyzeLog(serverLog);
  fs.writeFileSync(LOG_FILE, serverLog);

  const pathWidth = Math.max(...results.map((r) => r.path.length), 4);
  console.log(`결과  ${"path".padEnd(pathWidth + 1)} 상태  ${"content-type".padEnd(22)} 시간`);
  for (const r of results) {
    console.log(
      `${r.ok ? "PASS" : "FAIL"}  ${r.path.padEnd(pathWidth + 1)} ${String(r.status).padEnd(5)} ${r.type.padEnd(22)} ${String(r.ms).padStart(5)}ms${r.note ? `  ${r.note}` : ""}`,
    );
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[smoke] 요청 ${results.length}개 중 실패 ${failed.length}개`);
  console.log(`[smoke] 차단 주소(127.0.0.1:1) DB 접속 실패 로그 ${dbErrors}건 (정상: 운영 DB 에 접속하지 않았다는 뜻)`);
  console.log(`[smoke] 서버 로그: ${LOG_FILE}`);
  if (otherErrors.length) {
    console.log(`[smoke] DB 와 무관한 서버 오류 ${otherErrors.length}건:`);
    for (const block of otherErrors.slice(0, 5)) console.log(block.split("\n").slice(0, 8).join("\n"));
  }
  return failed.length === 0 && otherErrors.length === 0;
};

let success = false;
try {
  success = await main();
} catch (e) {
  console.error(`[smoke] 실패: ${e.message}`);
  if (serverLog) console.error(`--- 서버 로그 (마지막 40줄) ---\n${serverLog.split("\n").slice(-40).join("\n")}`);
} finally {
  await stopServer();
}
console.log(success ? "[smoke] 통과" : "[smoke] 실패");
process.exit(success ? 0 : 1);
