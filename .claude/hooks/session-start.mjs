#!/usr/bin/env node
// SessionStart 훅: 짧은 프로젝트 상태를 stdout 으로 출력한다 (Claude 컨텍스트에 추가됨).
// git 프로세스를 띄우지 않고 파일만 읽어 빠르게 끝나며, 어떤 경우에도 exit 0.
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());

const currentBranch = () => {
  try {
    let gitDir = path.join(ROOT, ".git");
    // worktree 에서는 .git 이 "gitdir: <path>" 를 담은 파일이다.
    if (statSync(gitDir).isFile()) {
      const m = readFileSync(gitDir, "utf8").match(/^gitdir:\s*(.+)$/m);
      if (!m) return "알 수 없음";
      gitDir = path.resolve(ROOT, m[1].trim());
    }
    const head = readFileSync(path.join(gitDir, "HEAD"), "utf8").trim();
    const ref = head.match(/^ref: refs\/heads\/(.+)$/);
    return ref ? ref[1] : `detached ${head.slice(0, 7)}`;
  } catch {
    return "알 수 없음";
  }
};

try {
  const lines = [`[blan19.com] 브랜치: ${currentBranch()}`];
  lines.push(
    existsSync(path.join(ROOT, "src", "generated", "prisma"))
      ? "- Prisma client: 생성됨 (src/generated/prisma)"
      : "- Prisma client: 없음 → 타입 검사/빌드 전에 `npx prisma generate` 실행 (DB 접속 없음)",
  );
  if (existsSync(path.join(ROOT, "node_modules")) === false) lines.push("- node_modules 없음 → `npm ci`");
  lines.push(
    existsSync(path.join(ROOT, ".env"))
      ? "- .env 있음 = 프로덕션 DB. 내용 출력/수정 금지. 화면 확인은 /run-app(preview), 자동 검증은 `npm run verify` (둘 다 DB 차단)"
      : "- .env 없음. 화면 확인은 /run-app(preview), 자동 검증은 `npm run verify` (둘 다 DB 차단)",
  );
  process.stdout.write(`${lines.join("\n")}\n`);
} catch {
  // 상태 출력 실패는 세션 시작을 막지 않는다.
}
process.exit(0);
