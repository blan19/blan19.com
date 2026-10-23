#!/usr/bin/env node
// 운영 DB 접속을 막은 환경에서 명령을 실행한다. 차단 주소와 env 는 scripts/lib/blocked-db.mjs 에 있다.
// 사용법: node scripts/with-blocked-db.mjs [--preview] <command> [...args]
//   예) node scripts/with-blocked-db.mjs next build
//   --preview: POSTGRES_URL 만 빈 값으로 둔다 → getViewCount 가 DB 에 접속하지 않아 글 화면이 정상으로 보인다(/run-app preview).
// 이 경로(scripts/with-blocked-db.mjs)는 guard-bash 가 DB 차단 실행으로 인정하는 기준이라 옮기지 않는다.
import { spawn } from "node:child_process";
import { blockedEnv } from "./lib/blocked-db.mjs";
import { resolveBin } from "./lib/paths.mjs";

let argv = process.argv.slice(2);
const preview = argv[0] === "--preview";
if (preview) argv = argv.slice(1);
const [cmd, ...args] = argv;
if (!cmd) {
  console.error("사용법: node scripts/with-blocked-db.mjs [--preview] <command> [...args]");
  process.exit(64);
}

const env = blockedEnv();
if (preview) env.POSTGRES_URL = "";
const child = spawn(resolveBin(cmd), args, { stdio: "inherit", env });

const forward = (signal) => {
  if (child.exitCode === null) child.kill(signal);
};
const signals = ["SIGINT", "SIGTERM", "SIGHUP"];
signals.forEach((s) => process.on(s, forward));

child.on("error", (error) => {
  console.error(`[with-blocked-db] 실행 실패: ${cmd} (${error.message})`);
  process.exit(127);
});

child.on("exit", (code, signal) => {
  signals.forEach((s) => process.off(s, forward));
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
