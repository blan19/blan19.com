#!/usr/bin/env node
// PreToolUse(Bash) 훅: 운영 DB / 프로덕션 배포 / .env 를 건드리는 명령을 막는다.
// - 차단: exit 2 + stderr(이유와 안전한 대안) → Claude 에게 전달된다.
// - 확인: exit 0 + permissionDecision "ask" (스키마 변경이 있는 상태의 git push / gh pr create / vercel deploy,
//   명령 이름이 변수인 경우 → 사용자에게 묻는다. 권한 모드에 따라 확인 창이 뜨지 않을 수 있다).
// - 입력이 이상하거나 내부 오류가 나면 조용히 exit 0 (fail open). 권한 deny 규칙이 2차 방어선이다.
// - 테스트: .claude/hooks/guard-bash.test.mjs (`npm run test:hooks`). 이 파일을 고치면 실행하고 케이스를 추가한다.
//
// 명령 문자열을 셸처럼 대략 토큰화해 && || ; | & 개행, $( ) / 백틱 / <( ), bash -c, eval, 파이프·<<< 로
// 셸에 넘긴 문자열 안쪽까지 "실제로 실행되는" 명령만 본다. 따옴표 안의 단순 언급(git commit -m "prisma db push")은 무시한다.
// 우회를 완벽히 막지는 못한다. 행동 규칙(CLAUDE.md)이 우선이다. 알려진 한계(막지 않음):
//   명령 치환이나 변수로 만든 경로(`cat $(echo .env)`), 스크립트 파일 안의 명령(`bash x.sh`, `node x.mjs`, `make`),
//   셸 env 출력(`printenv`, `env | grep …`), 디렉터리 통째 복사·압축(`cp -r . /tmp/x`, `tar cf x.tar .`),
//   묶인 짧은 옵션에 붙은 경로(`curl -d@.env`), 읽기 도구 목록(READERS)에 없는 명령.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const MAX_DEPTH = 6;

// ---------- 토크나이저 ----------
// 결과: segments = [{ words: [{ value, quoted }], redirs: [{ op, target }], heredocs: [body], pipedFrom?: segment }]
const lex = (src, depth = 0) => {
  const segments = [];
  if (depth > MAX_DEPTH) return segments;

  const parse = (start, stopAtParen) => {
    let i = start;
    let seg = { words: [], redirs: [], heredocs: [] };
    let lastSeg = null;
    let word = null;
    let quoted = false;
    let pendingRedir = null;
    const pendingHeredocs = [];
    let parenDepth = 0;

    const endWord = () => {
      if (word === null) return;
      if (pendingRedir) {
        pendingRedir.target = word;
        if (pendingRedir.op.startsWith("<<") && pendingRedir.op !== "<<<") {
          pendingHeredocs.push({ delim: word, strip: pendingRedir.op === "<<-", seg });
        }
        seg.redirs.push(pendingRedir);
        pendingRedir = null;
      } else {
        seg.words.push({ value: word, quoted });
      }
      word = null;
      quoted = false;
    };
    const endSeg = () => {
      endWord();
      if (seg.words.length || seg.redirs.length) {
        segments.push(seg);
        lastSeg = seg;
      }
      seg = { words: [], redirs: [], heredocs: [] };
    };
    const append = (s) => {
      word = (word ?? "") + s;
    };
    const nested = (inner) => {
      for (const s of lex(inner, depth + 1)) segments.push(s);
    };
    const skipHeredocs = () => {
      // i 는 개행 바로 다음. 대기 중인 heredoc 본문을 건너뛰고 본문은 세그먼트에 붙여 둔다.
      while (pendingHeredocs.length) {
        const { delim, strip, seg: owner } = pendingHeredocs.shift();
        const body = [];
        while (i < src.length) {
          let nl = src.indexOf("\n", i);
          if (nl === -1) nl = src.length;
          const line = src.slice(i, nl);
          i = nl + 1;
          if ((strip ? line.replace(/^\t+/, "") : line) === delim) break;
          body.push(line);
        }
        owner.heredocs.push(body.join("\n"));
      }
    };
    // $( ... ) 안쪽을 재귀 파싱하고 닫는 괄호 다음 위치를 돌려준다.
    const subshell = (from) => {
      const before = segments.length;
      const end = parse(from, true);
      return { end, added: segments.length - before };
    };

    while (i < src.length) {
      const c = src[i];
      const next = src[i + 1];

      if (c === "\\") {
        if (next === "\n") i += 2;
        else {
          append(next ?? "");
          i += 2;
        }
        continue;
      }
      if (c === "'") {
        const close = src.indexOf("'", i + 1);
        const end = close === -1 ? src.length : close;
        append(src.slice(i + 1, end));
        quoted = true;
        i = end + 1;
        continue;
      }
      if (c === '"') {
        quoted = true;
        word = word ?? "";
        i++;
        while (i < src.length && src[i] !== '"') {
          if (src[i] === "\\" && i + 1 < src.length) {
            // 큰따옴표 안의 \ 는 $ ` " \ 개행 앞에서만 이스케이프다("\-" 는 그대로 \-).
            if (!'$`"\\\n'.includes(src[i + 1])) append("\\");
            if (src[i + 1] !== "\n") append(src[i + 1]);
            i += 2;
          } else if (src[i] === "$" && src[i + 1] === "(" && src[i + 2] !== "(") {
            i = subshell(i + 2).end;
            append("$(…)");
          } else if (src[i] === "`") {
            const close = src.indexOf("`", i + 1);
            const end = close === -1 ? src.length : close;
            nested(src.slice(i + 1, end));
            append("`…`");
            i = end + 1;
          } else {
            append(src[i]);
            i++;
          }
        }
        i++;
        continue;
      }
      if (c === "#" && word === null) {
        while (i < src.length && src[i] !== "\n") i++;
        continue;
      }
      if (c === "$" && next === "(") {
        if (src[i + 2] === "(") {
          // $(( 산술 )) 은 명령이 아니다.
          const close = src.indexOf("))", i + 3);
          append("$((…))");
          i = close === -1 ? src.length : close + 2;
        } else {
          i = subshell(i + 2).end;
          append("$(…)");
        }
        continue;
      }
      if (c === "`") {
        const close = src.indexOf("`", i + 1);
        const end = close === -1 ? src.length : close;
        nested(src.slice(i + 1, end));
        append("`…`");
        i = end + 1;
        continue;
      }
      if ((c === "<" || c === ">") && next === "(") {
        endWord();
        i = subshell(i + 2).end;
        seg.words.push({ value: "<(…)", quoted: true });
        continue;
      }
      if (c === " " || c === "\t") {
        endWord();
        i++;
        continue;
      }
      if (c === "\n") {
        endSeg();
        i++;
        skipHeredocs();
        continue;
      }
      if (c === "(") {
        endSeg();
        parenDepth++;
        i++;
        continue;
      }
      if (c === ")") {
        if (parenDepth === 0 && stopAtParen) {
          endSeg();
          return i + 1;
        }
        parenDepth = Math.max(0, parenDepth - 1);
        endSeg();
        i++;
        continue;
      }
      if (c === ";" || c === "|" || (c === "&" && next !== ">")) {
        endSeg();
        // 파이프(| 또는 |&)면 다음 세그먼트에 앞 세그먼트를 연결한다(echo … | bash, ls .env* | xargs cat 판정용).
        if (c === "|" && next !== "|") seg.pipedFrom = lastSeg;
        i += (c === "|" && (next === "|" || next === "&")) || (c === "&" && next === "&") || (c === ";" && next === ";") ? 2 : 1;
        continue;
      }
      if (c === "<" || c === ">" || (c === "&" && next === ">")) {
        if (word !== null && /^\d+$/.test(word) && !quoted) word = null; // 2> 의 fd 번호
        endWord();
        let op = c;
        i++;
        while (i < src.length && /[<>&|-]/.test(src[i]) && op.length < 3) {
          if (src[i] === "-" && op !== "<<") break;
          op += src[i];
          i++;
        }
        if (/&$/.test(op) && /^[\d-]/.test(src[i] ?? "")) {
          // 2>&1, >&- 같은 fd 복제는 대상 파일이 없다.
          while (i < src.length && /[\d-]/.test(src[i])) i++;
          continue;
        }
        pendingRedir = { op, target: "" };
        continue;
      }
      append(c);
      i++;
    }
    endSeg();
    return i;
  };

  parse(0, false);
  return segments;
};

// ---------- 판정 도우미 ----------
const base = (w) => path.basename(w);
const isFlag = (w) => w.startsWith("-") && w !== "-";
const ENV_ASSIGN = /^[A-Za-z_][A-Za-z0-9_]*=/;
const KEYWORDS = new Set(["if", "then", "else", "elif", "do", "while", "until", "!", "{", "}", "time", "fi", "done"]);
const SHELLS = new Set(["bash", "sh", "zsh", "dash", "ksh"]);
const SIMPLE_WRAPPERS = new Set(["command", "builtin", "exec", "nohup", "noglob", "nocorrect", "corepack"]);
const SAFE_ENV_EXAMPLES = /^\.env\.(example|sample|template|dist)$/;

const globMatches = (glob, name) => {
  if (!/[*?[]/.test(glob)) return glob === name;
  if (!glob.startsWith(".")) return false; // 셸 glob 은 점으로 시작하는 파일을 * 로 잡지 않는다.
  const re = glob.replace(/[.+^${}()|\\]/g, "\\$&").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]");
  try {
    return new RegExp(`^${re}$`).test(name);
  } catch {
    return false;
  }
};

const isEnvPath = (arg) => {
  if (!arg) return false;
  const name = base(arg);
  if (SAFE_ENV_EXAMPLES.test(name)) return false;
  if (/^\.env(\..+)?$/.test(name)) return true;
  return [".env", ".env.local", ".env.production", ".env.development"].some((n) => globMatches(name, n));
};
// 인자 앞에 붙은 dd 의 if=, curl 의 @(파일 내용 전송)를 떼고 본다.
const isEnvArg = (arg) => isEnvPath(arg.replace(/^if=/, "").replace(/^@/, ""));

// NODE_OPTIONS="--require dotenv/config" 처럼 이후 node 실행마다 .env 를 불러오는 대입
const isDotenvNodeOptions = (assign) =>
  /^NODE_OPTIONS=/.test(assign) && /(^|[\s=])(-r|--require|--import|--loader)/.test(assign) && /dotenv/.test(assign);
// prisma.config.ts 는 import "dotenv/config" 로 .env 를 불러온다.
const LOADS_DOTENV = /dotenv|prisma\.config/;

const ENV_PRINTERS = new Set(["printenv", "env", "echo", "printf", "export", "set", "declare"]);
const BIN_PATHS = [
  [/(^|\/)prisma\/build\/index\.js$/, "prisma"],
  [/(^|\/)next\/dist\/bin\/next$/, "next"],
  [/(^|\/)node_modules\/\.bin\/(prisma|next|vercel)$/, null],
];
const binFromPath = (p) => {
  for (const [re, name] of BIN_PATHS) {
    const m = p.match(re);
    if (m) return name ?? m[2];
  }
  return null;
};

// origin/main 과의 분기점 대비 prisma/schema.prisma 변경이 있는지 (git push / gh pr create 확인용).
// 커밋뿐 아니라 작업 트리와 인덱스도 본다: `git commit -am … && git push` 처럼 한 명령에 묶여도 잡힌다. 실패하면 false.
const schemaChangedVsMain = () => {
  try {
    const opts = { cwd: PROJECT_DIR, encoding: "utf8", timeout: 3000 };
    const mb = spawnSync("git", ["merge-base", "origin/main", "HEAD"], opts);
    if (mb.status !== 0 || !mb.stdout.trim()) return false;
    const r = spawnSync("git", ["diff", "--name-only", mb.stdout.trim(), "--", "prisma/schema.prisma"], opts);
    return r.status === 0 && r.stdout.trim() !== "";
  } catch {
    return false;
  }
};

// 임시 디렉터리(/tmp, scratchpad 등) 아래의 절대경로인지. 이런 곳에 쓰는 테스트용 .env 는 운영 비밀과 무관하다.
const TMP_ROOTS = [...new Set([os.tmpdir(), "/tmp", "/private/tmp", "/var/folders", "/private/var/folders"].map((p) => path.resolve(p)))];
const isTmpPath = (p) => path.isAbsolute(p) && !p.includes("$") && TMP_ROOTS.some((r) => path.resolve(p).startsWith(`${r}/`));

const positionals = (args, valueFlags = []) => {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--") {
      out.push(...args.slice(i + 1));
      break;
    }
    if (isFlag(a)) {
      if (valueFlags.includes(a)) i++;
      continue;
    }
    out.push(a);
  }
  return out;
};

const MSG = {
  prismaWrite:
    "운영 DB 의 스키마나 데이터를 바꾸는 Prisma 명령입니다. 이 프로젝트의 .env 는 프로덕션 Postgres(Neon)를 가리킵니다.\n" +
    "  대안: 스키마는 prisma/schema.prisma 만 수정하고, DB 반영은 Vercel 배포의 vercel-build 스크립트가 합니다. 로컬 검증은 `npm run verify`.",
  prismaStudio:
    "Prisma Studio 는 운영 DB 데이터를 직접 보고 수정할 수 있습니다.\n  대안: 데이터 확인이 필요하면 사용자에게 요청하세요.",
  prismaPull:
    "`prisma db pull` 은 .env 의 운영 DB 에 접속해 스키마를 읽고 prisma/schema.prisma 를 덮어씁니다.\n" +
    "  대안: 스키마는 prisma/schema.prisma 가 기준입니다. 운영 DB 상태 확인이 필요하면 사용자에게 요청하세요.",
  prismaDiff:
    "이 `prisma migrate diff` 는 DB(config datasource, migrations 의 shadow DB, URL)에 접속합니다.\n" +
    "  대안: 스키마 파일끼리만 비교하세요: `node scripts/with-blocked-db.mjs npx prisma migrate diff --from-schema <이전.prisma> --to-schema prisma/schema.prisma --script`.",
  vercelBuild:
    "vercel-build 는 `prisma db push` 로 운영 DB 스키마를 바꾸며 Vercel 에서만 실행해야 합니다(`vercel build` 도 이 스크립트를 로컬에서 실행합니다).\n" +
    "  대안: 빌드 확인은 `npm run verify` 또는 `node scripts/with-blocked-db.mjs next build` (DB 차단).",
  realDbServer:
    "DB 차단 env 없이 서버를 띄우면 .env 의 운영 DB 에 붙습니다. /tech/<slug> 를 요청하면 운영 조회수가 올라갑니다(이미 사고가 있었음).\n" +
    "  대안: 화면 확인은 /run-app 스킬(`node scripts/with-blocked-db.mjs --preview next dev -p 3100`), 자동 검증은 `npm run verify`. " +
    "실제 DB 로 띄워야 한다면 사용자에게 직접 실행을 요청하세요.",
  vercelEnvPull:
    "`vercel env pull`/`vercel pull` 은 Vercel 의 비밀값(운영 DB 접속 정보 포함)을 로컬 파일로 씁니다.\n" +
    "  대안: 변수 이름은 코드(process.env.*)나 README 에서 확인하세요. 값이 필요하면 사용자에게 요청하세요.",
  shellStdin:
    "표준입력이나 파일로 셸에 명령을 넘기면 실행될 명령을 검사할 수 없습니다.\n  대안: 명령을 직접 실행하거나 `bash -c '<명령>'` 으로 쓰세요.",
  varCommand:
    "명령 이름이 변수라서 실제로 실행될 명령을 검사할 수 없습니다. 운영 DB 나 .env 를 건드리는 명령이 아닌지 확인한 뒤 승인하세요.",
  dotenvEval:
    "dotenv 로 .env(운영 DB 접속 정보)를 불러온 상태에서 코드를 실행하거나 값을 출력하려는 명령입니다.\n" +
    "  대안: DB 연결 문제도 env 값을 출력하지 말고 사용자에게 확인을 요청하세요. 런타임 확인은 `npm run verify` 나 /run-app(DB 차단).",
  vercelProd:
    "프로덕션 배포/환경변수를 바꾸는 vercel 명령입니다.\n" +
    "  대안: 배포는 main 머지 시 Vercel GitHub 연동이 처리합니다. 꼭 필요하면 사용자에게 직접 실행을 요청하세요.",
  envRead:
    ".env 에는 운영 DB 접속 정보가 있어 출력/복사/수정/삭제하면 안 됩니다.\n" +
    "  대안: 필요한 변수 이름은 코드(process.env.*)나 README 에서 확인하고, 실행 확인은 `npm run verify` 나 /run-app 스킬(DB 차단)로 하세요. " +
    "테스트용 env 파일이 필요하면 임시 디렉터리 절대경로로 리다이렉트(>)해 쓰거나 사용자에게 확인하세요.",
  schemaPush:
    "[스키마 변경 push] origin/main 대비 prisma/schema.prisma 변경(커밋 또는 작업 트리)이 있습니다. Vercel Preview 빌드도 vercel-build(prisma db push)를 실행하므로, " +
    "Preview 환경변수가 운영 DB 를 가리키면 push 나 PR 생성만으로 운영 스키마가 바뀝니다. 스키마 반영을 의도한 경우에만 승인하세요.",
  schemaDeploy:
    "[스키마 변경 배포] origin/main 대비 prisma/schema.prisma 변경(커밋 또는 작업 트리)이 있습니다. `vercel`/`vercel deploy`(Preview)의 원격 빌드도 vercel-build(prisma db push)를 실행하므로, " +
    "Preview 환경변수가 운영 DB 를 가리키면 운영 스키마가 바뀝니다. 이 프로젝트는 CLI 배포를 쓰지 않습니다. 스키마 반영을 의도한 경우에만 승인하세요.",
  grepRecursive:
    "프로젝트 루트를 재귀 검색하면 .env 의 비밀값까지 출력될 수 있습니다.\n" +
    "  대안: Grep 도구나 `rg`(.gitignore 존중)를 쓰거나, 검색 대상을 src/ contents/ 처럼 좁히거나, --exclude='.env*' 를 붙이세요. " +
    "패턴이 - 로 시작해 대상 경로로 오인된 경우면 `-e <패턴>` 으로 지정하세요.",
};

const READERS = new Set([
  "cat", "head", "tail", "less", "more", "bat", "batcat", "nl", "strings", "grep", "egrep", "fgrep", "rg", "ag",
  "awk", "gawk", "sed", "cut", "sort", "uniq", "tac", "xxd", "od", "hexdump", "base64", "view", "column", "paste",
  "fold", "diff", "tee", "cp", "mv", "rm", "unlink", "truncate", "shred", "source", ".",
  "dd", "tar", "zip", "jq", "iconv", "curl", "wget", "scp", "rsync", "vim", "vi", "nano", "emacs",
]);
const JS_EVAL = ["-e", "--eval", "-p", "--print"];
const INTERPRETERS = { node: JS_EVAL, bun: JS_EVAL, tsx: JS_EVAL, "ts-node": JS_EVAL, deno: ["eval"], python: ["-c"], python3: ["-c"], ruby: ["-e"], perl: ["-e", "-E"], php: ["-r"] };
const JS_RUNTIMES = new Set(["node", "bun", "deno", "tsx", "ts-node"]);
const PRELOAD_FLAGS = /^(-r|--require|--import|--loader)(=|$)/;
const PM_BUILTINS = new Set([
  "install", "i", "ci", "add", "remove", "rm", "uninstall", "update", "up", "upgrade", "exec", "dlx", "x", "create", "init",
  "why", "list", "ls", "outdated", "audit", "info", "view", "publish", "link", "unlink", "config", "cache", "store", "help",
  "test", "t", "import", "rebuild", "prune", "patch", "env", "setup", "pack", "licenses", "fetch", "dedupe", "explain",
]);

// ---------- 세그먼트 분석 ----------
const analyze = (command) => {
  const blocks = [];
  const asks = []; // 사용자 확인이 필요한 명령 (permissionDecision: ask)
  const ctx = { exportedSafeDb: false, vars: new Map() };

  const block = (what, msg) => blocks.push(`- \`${what}\`: ${msg}`);

  // 같은 명령 문자열 안에서 앞서 대입한 변수(P=prisma; npx $P …)를 펼친다. 모르는 변수는 그대로 둔다.
  const subst = (s) =>
    s.includes("$") ? s.replace(/\$\{([A-Za-z_]\w*)\}|\$([A-Za-z_]\w*)/g, (m, a, b) => ctx.vars.get(a ?? b) ?? m) : s;

  const WRITE_OPS = new Set([">", ">>", ">|", "&>", "&>>"]);
  const checkRedirs = (redirs, cmdText) => {
    for (const r of redirs) {
      if (r.op.startsWith("<<")) continue;
      const target = subst(r.target);
      if (WRITE_OPS.has(r.op) && isTmpPath(target)) continue; // 임시 디렉터리에 테스트용 env 쓰기는 허용
      if (isEnvPath(target)) block(`${cmdText} ${r.op} ${r.target}`.trim(), MSG.envRead);
    }
  };

  const runLexed = (src, state, depth) => {
    for (const s of lex(src, depth + 1)) runSegment(s.words, s.redirs, s.heredocs, state, depth + 1, s.pipedFrom);
  };

  const runSegment = (words, redirs, heredocs, state, depth, pipedFrom) => {
    if (depth > MAX_DEPTH) return;
    let w = words.map((x) => subst(x.value));
    checkRedirs(redirs, w.join(" "));
    const assigned = new Set(state.assigned);
    let blockedDb = state.blockedDb;
    let envLoaded = state.envLoaded; // dotenv 래퍼로 .env 가 env 에 올라간 상태
    const pendingVars = [];

    // 앞쪽의 키워드, 환경변수 대입, 단순 래퍼를 벗긴다.
    for (;;) {
      if (!w.length) {
        // 명령 없이 대입만 있는 세그먼트(P=prisma)는 뒤 세그먼트에서 쓰도록 기록한다.
        for (const [k, v] of pendingVars) ctx.vars.set(k, v);
        return;
      }
      const head = base(w[0]);
      if (KEYWORDS.has(w[0])) w = w.slice(1);
      else if (ENV_ASSIGN.test(w[0])) {
        if (isDotenvNodeOptions(w[0])) {
          block(w.join(" "), MSG.dotenvEval);
          return;
        }
        const eq = w[0].indexOf("=");
        assigned.add(w[0].slice(0, eq));
        pendingVars.push([w[0].slice(0, eq), w[0].slice(eq + 1)]);
        w = w.slice(1);
      } else if (w[0] === "export" || w[0] === "declare" || w[0] === "set") {
        for (const a of w.slice(1)) {
          if (isDotenvNodeOptions(a)) block(w.join(" "), MSG.dotenvEval);
          if (/^POSTGRES_PRISMA_URL=/.test(a)) ctx.exportedSafeDb = true;
          if (ENV_ASSIGN.test(a)) ctx.vars.set(a.slice(0, a.indexOf("=")), a.slice(a.indexOf("=") + 1));
        }
        return;
      } else if (binFromPath(w[0])) {
        // node_modules/prisma/build/index.js db push 처럼 경로로 직접 실행하는 경우
        w = [binFromPath(w[0]), ...w.slice(1)];
        break;
      } else if (SIMPLE_WRAPPERS.has(head) && !(head === "command" && w[1] === "-v")) w = w.slice(1);
      else if (head === "sudo" || head === "env" || head === "nice" || head === "stdbuf" || head === "timeout" || head === "watch") {
        let j = 1;
        const valueFlags = { sudo: ["-u", "-g", "-C", "-D"], env: ["-u", "-C", "-S"], nice: ["-n"], watch: ["-n", "-d"], timeout: ["-s", "-k"], stdbuf: ["-i", "-o", "-e"] }[head] ?? [];
        while (j < w.length) {
          if (valueFlags.includes(w[j])) j += 2;
          else if (isFlag(w[j])) j++;
          else if (ENV_ASSIGN.test(w[j])) {
            if (isDotenvNodeOptions(w[j])) {
              block(w.join(" "), MSG.dotenvEval);
              return;
            }
            assigned.add(w[j].split("=")[0]);
            j++;
          } else break;
        }
        if (head === "timeout" && j < w.length) j++; // 시간 인자
        w = w.slice(j);
      } else if (head === "xargs") {
        // ls .env* | xargs cat : 파이프로 받은 .env 파일 이름을 다른 명령에 넘긴다.
        // xargs cat <<< .env 도 같다.
        const herestringEnv = redirs.some((r) => r.op === "<<<" && isEnvPath(subst(r.target)));
        if (herestringEnv || (pipedFrom && pipedFrom.words.slice(1).some((x) => isEnvPath(subst(x.value))))) {
          block(`… | ${w.join(" ")}`, MSG.envRead);
          return;
        }
        let j = 1;
        while (j < w.length && isFlag(w[j])) j += ["-n", "-I", "-P", "-L", "-d", "-s", "-E", "-a"].includes(w[j]) ? 2 : 1;
        w = w.slice(j);
      } else if (head === "dotenv" || head === "dotenv-cli") {
        // dotenv-cli: .env 를 env 로 올려 명령을 실행한다. -p 는 값을 출력한다.
        const dd = w.indexOf("--");
        const opts = dd === -1 ? w.slice(1) : w.slice(1, dd);
        const rest = dd === -1 ? [] : w.slice(dd + 1);
        if (opts.includes("-p") || ENV_PRINTERS.has(base(rest[0] ?? ""))) {
          block(w.join(" "), MSG.envRead);
          return;
        }
        envLoaded = true;
        w = rest;
      } else if ((head === "node" || head === "bun") && w[1] && /with-blocked-db\.mjs$/.test(w[1])) {
        blockedDb = true;
        w = w.slice(2);
        if (w[0] === "--preview") w = w.slice(1);
      } else if ((head === "node" || head === "bun") && w[1] && binFromPath(w[1])) {
        // node node_modules/prisma/build/index.js …, node node_modules/.bin/next … 는 해당 CLI 로 본다.
        w = [binFromPath(w[1]), ...w.slice(2)];
      } else break;
    }

    if (w[0].includes("$")) {
      // P=… 가 이전 Bash 호출에서 대입됐거나 명령 치환 결과라 이름을 알 수 없다.
      asks.push(`${MSG.varCommand} (\`${w.join(" ")}\`)`);
      return;
    }
    const cmd = base(w[0]).replace(/^(.+)@[^/]*$/, "$1");
    const args = w.slice(1);
    const text = w.join(" ");
    const inner = { assigned, blockedDb, envLoaded };
    const recurse = (nextWords) => runSegment(nextWords.map((value) => ({ value })), [], [], inner, depth + 1);
    const realDbServer = (what) => {
      if (blockedDb || assigned.has("POSTGRES_PRISMA_URL") || ctx.exportedSafeDb) return;
      block(what, MSG.realDbServer);
    };
    // package.json 스크립트 실행(npm run, node --run 등) 판정
    const runScript = (script, what) => {
      if (script === "vercel-build") block(what, MSG.vercelBuild);
      else if (script === "dev" || script === "start") realDbServer(what);
    };

    // 셸/ eval 안쪽 문자열
    if (SHELLS.has(cmd)) {
      const ci = args.findIndex((a) => /^-[a-z]*c[a-z]*$/.test(a));
      if (ci !== -1 && args[ci + 1] !== undefined) {
        runLexed(args[ci + 1], inner, depth);
      } else if (!args.some((a) => !isFlag(a))) {
        // 스크립트 인자 없는 셸: 표준입력이 명령이다. heredoc, <<<, echo/printf 파이프만 검사할 수 있다.
        const herestrings = redirs.filter((r) => r.op === "<<<").map((r) => subst(r.target));
        const stdinFile = redirs.some((r) => r.op === "<");
        const pw = pipedFrom?.words.map((x) => subst(x.value)) ?? [];
        const fromEcho = pipedFrom && ["echo", "printf"].includes(base(pw[0] ?? ""));
        if (stdinFile || (pipedFrom && !fromEcho) || (!pipedFrom && !heredocs.length && !herestrings.length)) {
          block(text || cmd, MSG.shellStdin);
          return;
        }
        for (const body of [...heredocs, ...herestrings]) runLexed(body, inner, depth);
        if (fromEcho) runLexed(pw.slice(1).filter((a) => !/^-[neE]+$/.test(a)).join(" "), inner, depth);
      }
      return;
    }
    if (cmd === "eval") {
      runLexed(args.join(" "), inner, depth);
      return;
    }

    // 패키지 실행기
    if (cmd === "npx" || cmd === "bunx" || cmd === "pnpx") {
      let j = 0;
      while (j < args.length && isFlag(args[j])) {
        if (args[j] === "-c" || args[j] === "--call") {
          runLexed(args[j + 1] ?? "", inner, depth);
          return;
        }
        j += ["-p", "--package"].includes(args[j]) ? 2 : 1;
      }
      recurse(args.slice(j));
      return;
    }
    if (["npm", "pnpm", "yarn", "bun"].includes(cmd)) {
      const pos = positionals(args, ["--prefix", "-C", "--dir", "-w", "--workspace", "--filter", "-F", "--cwd", "--loglevel"]);
      const sub = pos[0];
      if (!sub) return;
      if (["exec", "x", "dlx"].includes(sub)) {
        const idx = args.indexOf(sub);
        let rest = args.slice(idx + 1);
        while (rest.length && isFlag(rest[0])) rest = rest.slice(["-p", "--package"].includes(rest[0]) ? 2 : 1);
        if (rest[0] === "--") rest = rest.slice(1);
        recurse(rest);
        return;
      }
      let script = null;
      if (["run", "run-script", "rum", "urn"].includes(sub)) script = pos[1];
      else if (sub === "start") script = "start";
      else if (cmd !== "npm" && !PM_BUILTINS.has(sub)) script = sub;
      if (!script) return;
      if (["vercel-build", "dev", "start"].includes(script)) runScript(script, text);
      else if (cmd !== "npm" && sub === script) recurse(pos); // pnpm prisma db push 처럼 bin 직접 실행
      return;
    }

    if (cmd === "vercel-build") {
      block(text, MSG.vercelBuild);
      return;
    }

    if (cmd === "prisma") {
      const pos = positionals(args, ["--schema", "--config", "--url", "--from-url", "--to-url"]);
      if (pos[0] === "db" && ["push", "execute", "seed"].includes(pos[1])) block(text, MSG.prismaWrite);
      else if (pos[0] === "db" && pos[1] === "pull") block(text, MSG.prismaPull);
      else if (pos[0] === "migrate" && pos[1] === "diff") {
        // 스키마 파일/빈 모델끼리 비교는 DB 에 접속하지 않는다. 그 밖의 입력은 DB 에 접속한다.
        const SAFE = /^--(from|to)-(schema|empty)(=|$)|^--(script|exit-code|config|output|help)(=|$)|^-[oh]$/;
        if (args.some((a) => a.startsWith("-") && !SAFE.test(a))) block(text, MSG.prismaDiff);
      } else if (pos[0] === "migrate") block(text, MSG.prismaWrite);
      else if (pos[0] === "studio") block(text, MSG.prismaStudio);
      return;
    }

    if (cmd === "next") {
      const sub = positionals(args, ["-p", "--port", "-H", "--hostname"])[0];
      if (sub === "dev" || sub === "start") realDbServer(text);
      return;
    }

    if (cmd === "vercel" || cmd === "vc") {
      const pos = positionals(args, ["--token", "-t", "--scope", "-S", "--cwd", "--target", "-A", "--local-config", "-m", "--meta", "-e", "--env", "-b", "--build-env", "--team", "-T"]);
      const prod = args.some((a, k) => a === "--prod" || a === "--production" || a === "--target=production" || (a === "--target" && args[k + 1] === "production"));
      if (prod) block(text, MSG.vercelProd);
      else if (pos[0] === "env" && ["rm", "remove", "add", "update"].includes(pos[1])) block(text, MSG.vercelProd);
      else if ((pos[0] === "env" && pos[1] === "pull") || pos[0] === "pull") block(text, MSG.vercelEnvPull);
      else if (["promote", "rollback", "remove", "rm"].includes(pos[0])) block(text, MSG.vercelProd);
      else if (pos[0] === "build") block(text, MSG.vercelBuild);
      else if (pos[0] === "dev") realDbServer(text);
      else if (pos[0] === undefined || pos[0] === "deploy") {
        const info = args.some((a) => ["-h", "--help", "-v", "--version"].includes(a));
        if (!info && schemaChangedVsMain()) asks.push(MSG.schemaDeploy);
      }
      return;
    }

    if (cmd === "git") {
      const pos = positionals(args, ["-C", "-c", "--git-dir", "--work-tree"]);
      const sub = pos[0];
      // git diff --no-index … .env, git show HEAD:.env 처럼 .env 내용을 출력하거나 스테이징하는 경우
      const envArg = pos.slice(1).some((a) => isEnvPath(a) || isEnvPath(a.split(":").pop()));
      if (envArg && ["diff", "show", "cat-file", "grep", "blame", "add", "archive"].includes(sub)) block(text, MSG.envRead);
      else if (sub === "push" && schemaChangedVsMain()) asks.push(MSG.schemaPush);
      return;
    }
    if (cmd === "gh" && args[0] === "pr" && args[1] === "create") {
      if (schemaChangedVsMain()) asks.push(MSG.schemaPush);
      return;
    }

    if (cmd === "find") {
      // find … -name .env -exec cat {} \; : 찾은 .env 를 다른 명령에 넘긴다.
      const execAt = args.findIndex((a) => ["-exec", "-execdir", "-ok", "-okdir"].includes(a));
      if (execAt === -1) return;
      if (args.slice(0, execAt).some((a) => isEnvPath(a))) {
        block(text, MSG.envRead);
        return;
      }
      let end = args.findIndex((a, k) => k > execAt && (a === ";" || a === "+"));
      if (end === -1) end = args.length;
      recurse(args.slice(execAt + 1, end));
      return;
    }

    if (JS_RUNTIMES.has(cmd)) {
      const valueOf = (a, k) => (a.includes("=") ? a.slice(a.indexOf("=") + 1) : args[k + 1] ?? "");
      // Node 24: node --run <script> 은 package.json 스크립트를 실행한다(npm run 과 같게 판정).
      const runAt = cmd === "node" ? args.findIndex((a) => /^--run(=|$)/.test(a)) : -1;
      if (runAt !== -1) {
        runScript(valueOf(args[runAt], runAt), text);
        return;
      }
      if (args.some((a, k) => /^--env-file(-if-exists)?(=|$)/.test(a) && isEnvPath(valueOf(a, k)))) {
        block(text, MSG.envRead);
        return;
      }
      // node -r dotenv/config …, --import dotenv/config : .env 를 불러온 채 실행한다.
      if (args.some((a, k) => PRELOAD_FLAGS.test(a) && LOADS_DOTENV.test(valueOf(a, k)))) {
        block(text, MSG.dotenvEval);
        return;
      }
    }

    if (INTERPRETERS[cmd]) {
      const flags = INTERPRETERS[cmd];
      // perl -ne / -pe / -lne, ruby -ne 처럼 묶인 짧은 옵션이 e 로 끝나면 다음 인자가 코드다.
      const isEval = (a) =>
        flags.includes(a) || ((cmd === "perl" || cmd === "ruby") && /^-[a-zA-Z]+$/.test(a) && flags.some((f) => a.endsWith(f.slice(1))));
      const codeAt = new Set();
      args.forEach((a, k) => {
        if (!isEval(a)) return;
        codeAt.add(k + 1);
        const code = args[k + 1] ?? "";
        if (/(^|[^\w$.])\.env(?!\w|\.(example|sample|template)\b)/.test(code)) block(`${cmd} ${a} …`, MSG.envRead);
        // require('dotenv').config(), import 'dotenv/config', import prisma.config, 또는 dotenv 래퍼 아래에서 실행하는 코드
        else if (LOADS_DOTENV.test(code) || envLoaded) block(`${cmd} ${a} …`, MSG.dotenvEval);
      });
      // perl -ne print .env, python3 x.py .env 처럼 .env 를 입력 파일로 넘기는 경우
      if (args.some((a, k) => !codeAt.has(k) && isEnvArg(a))) block(text, MSG.envRead);
      return;
    }

    if (READERS.has(cmd)) {
      const target = args.find((a) => isEnvArg(a) || (a.startsWith("--") && a.includes("=") && isEnvArg(a.split("=").pop()) && !a.startsWith("--exclude")));
      if (target) {
        block(text, MSG.envRead);
        return;
      }
      if (["grep", "egrep", "fgrep"].includes(cmd)) {
        const recursive = args.some((a) => a === "--recursive" || a === "--dereference-recursive" || /^-[a-zA-Z]*[rR]/.test(a) && !a.startsWith("--"));
        if (!recursive) return;
        const excluded = args.some((a) => /^--exclude=/.test(a) && globMatches(a.slice(10).replace(/^['"]|['"]$/g, ""), ".env"));
        if (excluded) return;
        const hasPatternFlag = args.some((a) => a === "-e" || a === "-f" || a.startsWith("--regexp") || a.startsWith("--file"));
        const pos = positionals(args, ["-e", "-f", "-m", "-A", "-B", "-C", "--regexp", "--file", "--max-count", "--include", "--exclude", "--exclude-dir"]);
        const targets = hasPatternFlag ? pos : pos.slice(1);
        const root = path.resolve(PROJECT_DIR);
        const risky = targets.length === 0 || targets.some((t) => [".", "./", ".."].includes(t) || path.resolve(PROJECT_DIR, t) === root);
        if (risky) block(text, MSG.grepRecursive);
        return;
      }
      if (cmd === "rg") {
        const u = args.filter((a) => /^-[a-zA-Z]*u/.test(a) && !a.startsWith("--")).reduce((n, a) => n + (a.match(/u/g) ?? []).length, 0);
        const hidden = u >= 2 || args.includes("--hidden") || args.includes("-.");
        const noIgnore = u >= 1 || args.some((a) => a.startsWith("--no-ignore"));
        if (hidden && noIgnore) block(text, MSG.grepRecursive);
      }
    }
  };

  for (const seg of lex(command)) {
    runSegment(seg.words, seg.redirs, seg.heredocs, { assigned: new Set(), blockedDb: false, envLoaded: false }, 0, seg.pipedFrom);
  }
  return { blocks: [...new Set(blocks)], asks: [...new Set(asks)] };
};

// ---------- 진입점 ----------
const main = () => {
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return 0;
  }
  const command = input?.tool_input?.command;
  if (typeof command !== "string" || command.trim() === "") return 0;

  const { blocks, asks } = analyze(command);
  if (blocks.length) {
    process.stderr.write(`[guard-bash] 이 명령은 프로젝트 안전 규칙으로 차단되었습니다.\n${blocks.join("\n")}\n`);
    return 2;
  }
  if (asks.length) {
    const reason = `[guard-bash] ${asks.join(" ")}`;
    process.stdout.write(
      JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason } }),
    );
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
