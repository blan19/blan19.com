#!/usr/bin/env node
// 프로덕션 빌드(.next)를 운영 DB 차단 환경에서 `next start` 로 띄우고 주요 라우트를 요청한다.
// 사용법: node scripts/smoke.mjs   (먼저 npm run verify 또는 node scripts/with-blocked-db.mjs next build 로 빌드)
// DB 를 쓰는 부분은 차단 주소(scripts/lib/blocked-db.mjs)에서 즉시 실패하는 것이 정상이며 HTTP 상태는 200 이어야 한다.
// 서버 로그는 성공, 실패와 무관하게 .next/smoke-server.log 에 남긴다(worktree 마다 따로, 빌드마다 덮어씀).
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { BLOCKED_DB_HOST, BLOCKED_DB_URL, blockedEnv } from "./lib/blocked-db.mjs";
import { ROOT, resolveBin } from "./lib/paths.mjs";

const READY_TIMEOUT_MS = 60_000;
const REQUEST_TIMEOUT_MS = 30_000;
const KILL_GRACE_MS = 5_000;
const LOG_FILE = path.join(ROOT, ".next", "smoke-server.log");

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
const SITE = "https://www.blan19.xyz";
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const title = (text) => new RegExp(`<title>${escapeRe(text)}</title>`);
// 404 HTML 은 레이아웃(lang)과 not-found.tsx 제목을 서버에서 그려야 한다(오류 셸 <html id="__next_error__"> 이면 실패).
// robots 메타는 Next 가 넣는 noindex 하나만 있어야 한다(layout 이 robots 를 정하면 index, follow 가 하나 더 붙는다).
const NOT_FOUND_PAGE = [
  /<html lang="ko"/,
  /<h1 class="page-h1">페이지를 찾을 수 없습니다<\/h1>/,
  title("페이지를 찾을 수 없습니다 | blan19"),
  /<meta name="robots" content="noindex"\/>/,
];
const NOT_FOUND_NOT = [/name="robots"[\s\S]*name="robots"/];
// body: 응답 본문에 있어야 하는 패턴. 페이지가 alternates 를 덮어쓰면 RSS 링크가 빠지므로 함께 본다.
// notBody: 있으면 안 되는 패턴. assert: 본문을 받아 문제를 문자열로 돌려주는 함수(통과면 null).
const head = (path) => [
  new RegExp(`<link rel="canonical" href="${escapeRe(SITE + path)}"/>`),
  /<link rel="alternate" type="application\/rss\+xml"/,
];
// openGraph 는 얕게 병합되므로 페이지마다 공통 필드(사이트 이름, locale, 이미지 크기)가 다시 들어갔는지 본다.
const og = (path) => [
  /<meta property="og:site_name" content="blan19 기술 블로그"\/>/,
  /<meta property="og:locale" content="ko_KR"\/>/,
  new RegExp(`<meta property="og:url" content="${escapeRe(SITE + path)}/?"/>`),
  new RegExp(`<meta property="og:image" content="${escapeRe(SITE + path)}/opengraph-image(\\?[^"]*)?"/>`),
  /<meta property="og:image:width" content="1200"\/>/,
  /<meta name="twitter:card" content="summary_large_image"\/>/,
];
// 글 JSON-LD 는 @graph 하나에 BlogPosting, BreadcrumbList, WebSite, Person 이 있어야 한다.
const postGraph = (body) => {
  const match = body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) return "JSON-LD 없음";
  let data;
  try {
    data = JSON.parse(match[1]);
  } catch (e) {
    return `JSON-LD 파싱 실패: ${e.message}`;
  }
  const types = (data["@graph"] ?? []).map((node) => node["@type"]);
  const missing = ["BlogPosting", "BreadcrumbList", "WebSite", "Person"].filter((t) => !types.includes(t));
  if (missing.length) return `JSON-LD @graph 에 없음: ${missing.join(", ")}`;
  const post = data["@graph"].find((node) => node["@type"] === "BlogPosting");
  return post.dateModified ? null : "BlogPosting 에 dateModified 없음";
};
const checks = [
  { path: "/", type: HTML, body: [...head(""), ...og(""), title("blan19 기술 블로그"), /"@type":"WebSite"/] },
  { path: "/tech", type: HTML, body: [...head("/tech"), ...og("/tech"), title("글 목록 | blan19")] },
  { path: "/tech?tag=react.js", type: HTML, body: head("/tech") },
  { path: "/tech?tag=__none__", type: HTML },
  { path: "/log", type: HTML, body: [...head("/log"), ...og("/log"), title("기록 | blan19")] },
  ...techSlugs().map((slug) => ({
    path: `/tech/${encodeURIComponent(slug)}`,
    type: HTML,
    body: [...head(`/tech/${slug}`), ...og(`/tech/${slug}`), /<meta property="og:type" content="article"\/>/],
    assert: postGraph,
  })),
  // 목록에 없는 글은 src/proxy.ts 가 루트 404 로 돌린다(partialPrefetching 을 켜면 200 + noindex 로 바뀌었다).
  { path: "/tech/__smoke-not-found__", status: 404, type: HTML, body: NOT_FOUND_PAGE, notBody: NOT_FOUND_NOT },
  { path: "/rss.xml", type: XML },
  { path: "/rss-atom.xml", type: XML },
  { path: "/sitemap.xml", type: XML, notBody: [/<loc>[^<]*\/llms\.txt<\/loc>/] },
  { path: "/robots.txt", type: /text\/plain/, body: [/Allow: \//], notBody: [/^Host:/m] },
  { path: "/llms.txt", type: /text\/plain/, body: [/^# blan19 기술 블로그\n/, new RegExp(`\\]\\(${escapeRe(SITE)}/tech/`)] },
  { path: "/opengraph-image", type: /image\/png/ },
  { path: "/tech/opengraph-image", type: /image\/png/ },
  { path: "/log/opengraph-image", type: /image\/png/ },
  ...techSlugs().slice(0, 1).map((slug) => ({ path: `/tech/${encodeURIComponent(slug)}/opengraph-image`, type: /image\/png/ })),
  { path: "/tech/__smoke-not-found__/opengraph-image", status: 404, type: /./ },
  { path: "/icon.svg", type: /image\/svg\+xml/ },
  { path: "/__smoke-not-found__", status: 404, type: HTML, body: NOT_FOUND_PAGE, notBody: NOT_FOUND_NOT },
];

let server = null;
let serverLog = "";
let spawnError = null;

const hasExited = () => server.exitCode !== null || server.signalCode !== null;

const stopServer = async () => {
  if (!server || hasExited() || spawnError) return;
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
    const body = new TextDecoder().decode(await res.arrayBuffer());
    return { res, body };
  } finally {
    clearTimeout(timer);
  }
};

const waitForReady = async (base) => {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (spawnError) throw new Error(`서버 실행 실패 (${spawnError.message})`);
    if (hasExited()) throw new Error(`서버가 시작 중 종료됨 (${server.signalCode ?? `exit ${server.exitCode}`})`);
    try {
      const { res } = await fetchWithTimeout(`${base}/robots.txt`, 2_000);
      if (res.status === 200) return;
    } catch {
      // 아직 준비 안 됨
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`${READY_TIMEOUT_MS / 1000}초 안에 서버가 준비되지 않음`);
};

// 서버 로그의 ⨯ 오류 중 차단 주소 접속 실패만 정상으로 보고, 그 외 오류는 실패로 본다.
const BLOCKED_HOST_RE = new RegExp(escapeRe(BLOCKED_DB_HOST) + "\\b");
const analyzeLog = (log) => {
  const blocks = log.split(/\n(?=\s*⨯)/).filter((b) => b.trimStart().startsWith("⨯"));
  const blocked = (b) => BLOCKED_HOST_RE.test(b) && /P1001|DatabaseNotReachable|ECONNREFUSED|reach database/.test(b);
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
  server.on("error", (e) => (spawnError = e));
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
      const { res, body } = await fetchWithTimeout(base + check.path, REQUEST_TIMEOUT_MS);
      status = res.status;
      type = (res.headers.get("content-type") ?? "").split(";")[0];
      const missing = (check.body ?? []).filter((re) => !re.test(body));
      const unexpected = (check.notBody ?? []).filter((re) => re.test(body));
      const problem = check.assert?.(body) ?? null;
      ok = status === expectStatus && check.type.test(type) && missing.length === 0 && unexpected.length === 0 && !problem;
      if (status !== expectStatus || !check.type.test(type)) note = `기대: ${expectStatus} ${check.type.source}`;
      else if (missing.length) note = `본문에 없음: ${missing.map((re) => re.source).join(", ")}`;
      else if (unexpected.length) note = `본문에 있으면 안 됨: ${unexpected.map((re) => re.source).join(", ")}`;
      else if (problem) note = problem;
    } catch (e) {
      note = e.name === "AbortError" ? "시간 초과" : e.message;
    }
    results.push({ ok, path: check.path, status, type, ms: Date.now() - t0, note });
  }

  // 로그가 마저 흘러나오도록 잠깐 기다린다.
  await new Promise((r) => setTimeout(r, 500));
  const { dbErrors, otherErrors } = analyzeLog(serverLog);

  const pathWidth = Math.max(...results.map((r) => r.path.length), 4);
  console.log(`결과  ${"path".padEnd(pathWidth + 1)} 상태  ${"content-type".padEnd(22)} 시간`);
  for (const r of results) {
    console.log(
      `${r.ok ? "PASS" : "FAIL"}  ${r.path.padEnd(pathWidth + 1)} ${String(r.status).padEnd(5)} ${r.type.padEnd(22)} ${String(r.ms).padStart(5)}ms${r.note ? `  ${r.note}` : ""}`,
    );
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[smoke] 요청 ${results.length}개 중 실패 ${failed.length}개`);
  console.log(`[smoke] 차단 주소(${BLOCKED_DB_HOST}) DB 접속 실패 로그 ${dbErrors}건 (정상: 운영 DB 에 접속하지 않았다는 뜻)`);
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
  if (serverLog) {
    try {
      fs.writeFileSync(LOG_FILE, serverLog);
      console.log(`[smoke] 서버 로그: ${LOG_FILE}`);
    } catch (e) {
      console.error(`[smoke] 서버 로그 저장 실패: ${e.message}`);
    }
  }
}
console.log(success ? "[smoke] 통과" : "[smoke] 실패");
process.exit(success ? 0 : 1);
