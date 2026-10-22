#!/usr/bin/env node
// 운영 DB 접속을 막은 환경에서 명령을 실행한다.
// 사용법: node scripts/with-blocked-db.mjs [--preview] <command> [...args]
//   예) node scripts/with-blocked-db.mjs next build
//   --preview: POSTGRES_URL 만 빈 값으로 둔다 → getViewCount 가 DB 에 접속하지 않아 글 화면이 정상으로 보인다(/run-app preview).
// .env의 POSTGRES_* 값보다 process env가 우선하므로(Next.js, dotenv 모두)
// 아래 값으로 덮어쓰면 어떤 DB 쿼리도 127.0.0.1:1 에서 즉시 실패한다.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BLOCKED_DB_URL = "postgres://blocked:blocked@127.0.0.1:1/blocked";

export const blockedEnv = (base = process.env) => ({
  ...base,
  POSTGRES_URL: BLOCKED_DB_URL,
  POSTGRES_PRISMA_URL: BLOCKED_DB_URL,
  POSTGRES_URL_NON_POOLING: BLOCKED_DB_URL,
  POSTGRES_URL_NO_SSL: BLOCKED_DB_URL,
  DATABASE_URL: BLOCKED_DB_URL,
  POSTGRES_HOST: "127.0.0.1",
  POSTGRES_USER: "blocked",
  POSTGRES_PASSWORD: "blocked",
  POSTGRES_DATABASE: "blocked",
  BLAN19_BLOCKED_DB: "1",
});

// node_modules/.bin 에 있으면 그 경로를, 없으면 PATH 에서 찾도록 이름 그대로 돌려준다.
export const resolveBin = (cmd) => {
  if (cmd.includes("/")) return cmd;
  const local = path.join(ROOT, "node_modules", ".bin", cmd);
  return existsSync(local) ? local : cmd;
};

const main = () => {
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
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
