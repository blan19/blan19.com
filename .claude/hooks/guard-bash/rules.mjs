// guard-bash 판정 규칙. analyze(command, { projectDir }) → { blocks, asks }. 진입점은 ../guard-bash.mjs.
// runSegment 가 앞쪽 래퍼(대입, env, sudo, xargs, dotenv, with-blocked-db 등)를 벗긴 뒤 명령 이름으로 핸들러를 고른다.
// 명령을 추가하려면 HANDLERS 에 (c) => void 함수를 넣고 guard-bash.test.mjs 에 케이스를 추가한다.
// c: { cmd, args, text, redirs, heredocs, pipedFrom, inner, envLoaded, projectDir,
//      block(what, msg), ask(msg), recurse(words, { cwdUnknown }?), runLexed(src), realDbServer(what), runScript(script, what), isProjectScope(target) }
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { MAX_DEPTH, lex } from "./lex.mjs";

// ---------- 판정 도우미 ----------
const base = (w) => path.basename(w);
const isFlag = (w) => w.startsWith("-") && w !== "-";
const ENV_ASSIGN = /^[A-Za-z_][A-Za-z0-9_]*=/;
const KEYWORDS = new Set(["if", "then", "else", "elif", "do", "while", "until", "!", "{", "}", "time", "fi", "done"]);
const SHELLS = new Set(["bash", "sh", "zsh", "dash", "ksh"]);
const SIMPLE_WRAPPERS = new Set(["command", "builtin", "exec", "nohup", "noglob", "nocorrect", "corepack"]);
const CD_COMMANDS = new Set(["cd", "pushd", "popd", "chdir"]); // chdir: zsh 의 cd 별칭
const SAFE_ENV_EXAMPLES = /^\.env\.(example|sample|template|dist)$/;
const ENV_NAMES = [".env", ".env.local", ".env.production", ".env.development"];
// DB 차단 실행으로 인정하는 스크립트. basename 이 아니라 프로젝트 안의 이 경로로 해석될 때만 믿는다.
const BLOCKED_DB_SCRIPT = "scripts/with-blocked-db.mjs";

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

// find -name/-path 의 fnmatch: 셸 glob 과 달리 * 가 점으로 시작하는 이름(.env)도 잡는다.
const fnmatch = (pattern, name, ignoreCase = false) => {
  const re = pattern
    .replace(/[.+^${}()|\\]/g, "\\$&")
    .replace(/\[!/g, "[^")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  try {
    return new RegExp(`^${re}$`, ignoreCase ? "i" : "").test(name);
  } catch {
    return false;
  }
};

const isEnvPath = (arg) => {
  if (!arg) return false;
  const name = base(arg);
  if (SAFE_ENV_EXAMPLES.test(name)) return false;
  if (/^\.env(\..+)?$/.test(name)) return true;
  return ENV_NAMES.some((n) => globMatches(name, n));
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
const schemaChangedVsMain = (projectDir) => {
  try {
    const opts = { cwd: projectDir, encoding: "utf8", timeout: 3000 };
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

const expandHome = (p) => (p === "~" ? os.homedir() : p.startsWith("~/") ? path.join(os.homedir(), p.slice(2)) : p);
// ~user, ~+($PWD), ~-($OLDPWD) 처럼 홈 말고 다른 곳으로 펼쳐지는 ~ 접두어
const isOtherTilde = (p) => p.startsWith("~") && p !== "~" && !p.startsWith("~/");
const realOrResolved = (p) => {
  try {
    return realpathSync(p);
  } catch {
    return path.resolve(p);
  }
};
// 커널처럼 앞에서부터 심볼릭 링크를 풀며 ".." 를 처리한 실제 경로(link/.. 는 링크 대상의 상위). 없으면 null.
const physical = (p) => {
  try {
    return realpathSync.native(p);
  } catch {
    return null;
  }
};
// 존재하는 가장 가까운 상위 경로를 실제 경로로 풀고 나머지를 붙인다(없는 경로도 /tmp → /private/tmp 같은 링크를 반영).
const realish = (p) => {
  const abs = path.resolve(p);
  const rest = [];
  for (let cur = abs; ; cur = path.dirname(cur)) {
    const real = physical(cur);
    if (real) return path.join(real, ...rest);
    if (path.dirname(cur) === cur) return abs;
    rest.unshift(path.basename(cur));
  }
};
// dir 이 target 자신이거나 그 상위 디렉터리인지
const containsPath = (dir, target) => {
  const rel = path.relative(dir, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
};
const isDirectory = (p) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
};

// 래퍼(env, sudo)의 옵션을 getopt 처럼 벗긴다. 묶인 짧은 옵션(-iC dir, -uroot)과 --opt=값, --opt 값을 읽는다.
// valueShort: 값을 받는 짧은 옵션 글자, valueLong: 값을 받는 긴 옵션 → 짧은 글자. 결과: { j: 명령 시작 위치, opts: [[글자 또는 긴 이름, 값]] }
const wrapperOpts = (w, valueShort, valueLong = {}) => {
  const opts = [];
  let j = 1;
  while (j < w.length) {
    const a = w[j];
    if (a === "--") {
      j++;
      break;
    }
    if (a === "-") {
      opts.push(["-", ""]); // env - (= -i)
      j++;
    } else if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      const name = eq === -1 ? a : a.slice(0, eq);
      const key = valueLong[name] ?? name;
      if (eq === -1 && valueLong[name]) {
        opts.push([key, w[j + 1] ?? ""]);
        j += 2;
      } else {
        opts.push([key, eq === -1 ? "" : a.slice(eq + 1)]);
        j++;
      }
    } else if (isFlag(a)) {
      for (let k = 1; k < a.length; k++) {
        if (!valueShort.includes(a[k])) {
          opts.push([a[k], ""]);
          continue;
        }
        if (k + 1 < a.length) opts.push([a[k], a.slice(k + 1)]);
        else opts.push([a[k], w[++j] ?? ""]);
        break;
      }
      j++;
    } else break;
  }
  return { j, opts };
};

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
  findExecRead:
    "이름 필터 없이 find 로 찾은 프로젝트 파일을 읽기 도구에 넘기면 .env 까지 읽힙니다.\n" +
    "  대안: -name '*.mdx' 처럼 이름 필터를 붙이거나(-not -name '.env*' 도 됨), 시작 경로를 src/ contents/ 처럼 좁히세요.",
  findUnmodeled:
    "find 식에 이 훅이 해석하지 못하는 요소가 있어 -exec 가 어떤 파일에 실행될지 판단할 수 없습니다.\n" +
    "  대안: 시작 경로를 src/ contents/ 처럼 좁히거나, -name/-type/-o/( ) 같은 기본 요소로 식을 다시 쓰세요.",
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

// ---------- 명령별 핸들러 ----------
// 셸 / bash -c / 표준입력으로 넘긴 명령
const shell = (c) => {
  const { args, redirs, heredocs, pipedFrom } = c;
  const ci = args.findIndex((a) => /^-[a-z]*c[a-z]*$/.test(a));
  if (ci !== -1 && args[ci + 1] !== undefined) {
    c.runLexed(args[ci + 1]);
  } else if (!args.some((a) => !isFlag(a))) {
    // 스크립트 인자 없는 셸: 표준입력이 명령이다. heredoc, <<<, echo/printf 파이프만 검사할 수 있다.
    const herestrings = redirs.filter((r) => r.op === "<<<").map((r) => c.subst(r.target));
    const stdinFile = redirs.some((r) => r.op === "<");
    const pw = pipedFrom?.words.map((x) => c.subst(x.value)) ?? [];
    const fromEcho = pipedFrom && ["echo", "printf"].includes(base(pw[0] ?? ""));
    if (stdinFile || (pipedFrom && !fromEcho) || (!pipedFrom && !heredocs.length && !herestrings.length)) {
      c.block(c.text || c.cmd, MSG.shellStdin);
      return;
    }
    for (const body of [...heredocs, ...herestrings]) c.runLexed(body);
    if (fromEcho) c.runLexed(pw.slice(1).filter((a) => !/^-[neE]+$/.test(a)).join(" "));
  }
};

// npx / bunx / pnpx
const packageRunner = (c) => {
  const { args } = c;
  let j = 0;
  while (j < args.length && isFlag(args[j])) {
    if (args[j] === "-c" || args[j] === "--call") {
      c.runLexed(args[j + 1] ?? "");
      return;
    }
    j += ["-p", "--package"].includes(args[j]) ? 2 : 1;
  }
  c.recurse(args.slice(j));
};

// npm / pnpm / yarn / bun: package.json 스크립트와 exec
const packageManager = (c) => {
  const { cmd, args } = c;
  const pos = positionals(args, ["--prefix", "-C", "--dir", "-w", "--workspace", "--filter", "-F", "--cwd", "--loglevel"]);
  const sub = pos[0];
  if (!sub) return;
  if (["exec", "x", "dlx"].includes(sub)) {
    const idx = args.indexOf(sub);
    let rest = args.slice(idx + 1);
    while (rest.length && isFlag(rest[0])) rest = rest.slice(["-p", "--package"].includes(rest[0]) ? 2 : 1);
    if (rest[0] === "--") rest = rest.slice(1);
    c.recurse(rest);
    return;
  }
  let script = null;
  if (["run", "run-script", "rum", "urn"].includes(sub)) script = pos[1];
  else if (sub === "start") script = "start";
  else if (cmd !== "npm" && !PM_BUILTINS.has(sub)) script = sub;
  if (!script) return;
  if (["vercel-build", "dev", "start"].includes(script)) c.runScript(script, c.text);
  else if (cmd !== "npm" && sub === script) c.recurse(pos); // pnpm prisma db push 처럼 bin 직접 실행
};

const prisma = (c) => {
  const { args, text } = c;
  const pos = positionals(args, ["--schema", "--config", "--url", "--from-url", "--to-url"]);
  if (pos[0] === "db" && ["push", "execute", "seed"].includes(pos[1])) c.block(text, MSG.prismaWrite);
  else if (pos[0] === "db" && pos[1] === "pull") c.block(text, MSG.prismaPull);
  else if (pos[0] === "migrate" && pos[1] === "diff") {
    // 스키마 파일/빈 모델끼리 비교는 DB 에 접속하지 않는다. 그 밖의 입력은 DB 에 접속한다.
    const SAFE = /^--(from|to)-(schema|empty)(=|$)|^--(script|exit-code|config|output|help)(=|$)|^-[oh]$/;
    if (args.some((a) => a.startsWith("-") && !SAFE.test(a))) c.block(text, MSG.prismaDiff);
  } else if (pos[0] === "migrate") c.block(text, MSG.prismaWrite);
  else if (pos[0] === "studio") c.block(text, MSG.prismaStudio);
};

const next = (c) => {
  const sub = positionals(c.args, ["-p", "--port", "-H", "--hostname"])[0];
  if (sub === "dev" || sub === "start") c.realDbServer(c.text);
};

// vercel / vc. 막는 하위 명령 목록은 .claude/settings.json 의 deny 와 맞춘다.
const vercel = (c) => {
  const { args, text } = c;
  const pos = positionals(args, ["--token", "-t", "--scope", "-S", "--cwd", "--target", "-A", "--local-config", "-m", "--meta", "-e", "--env", "-b", "--build-env", "--team", "-T"]);
  const prod = args.some((a, k) => a === "--prod" || a === "--production" || a === "--target=production" || (a === "--target" && args[k + 1] === "production"));
  if (prod) c.block(text, MSG.vercelProd);
  else if (pos[0] === "env" && ["rm", "remove", "add", "update"].includes(pos[1])) c.block(text, MSG.vercelProd);
  else if ((pos[0] === "env" && pos[1] === "pull") || pos[0] === "pull") c.block(text, MSG.vercelEnvPull);
  else if (["promote", "rollback", "remove", "rm"].includes(pos[0])) c.block(text, MSG.vercelProd);
  else if (pos[0] === "build") c.block(text, MSG.vercelBuild);
  else if (pos[0] === "dev") c.realDbServer(text);
  else if (pos[0] === undefined || pos[0] === "deploy") {
    const info = args.some((a) => ["-h", "--help", "-v", "--version"].includes(a));
    if (!info && schemaChangedVsMain(c.projectDir)) c.ask(MSG.schemaDeploy);
  }
};

const git = (c) => {
  const { args, text } = c;
  const pos = positionals(args, ["-C", "-c", "--git-dir", "--work-tree"]);
  const sub = pos[0];
  // git diff --no-index … .env, git show HEAD:.env 처럼 .env 내용을 출력하거나 스테이징하는 경우
  const envArg = pos.slice(1).some((a) => isEnvPath(a) || isEnvPath(a.split(":").pop()));
  if (envArg && ["diff", "show", "cat-file", "grep", "blame", "add", "archive"].includes(sub)) c.block(text, MSG.envRead);
  else if (sub === "push" && schemaChangedVsMain(c.projectDir)) c.ask(MSG.schemaPush);
  else if (sub === "grep") {
    // --untracked/--no-index 에 --no-exclude-standard 를 더하면 .gitignore 된 .env 까지 검색한다.
    const grepArgs = args.slice(args.indexOf("grep") + 1);
    const unignored = grepArgs.includes("--no-exclude-standard") && (grepArgs.includes("--untracked") || grepArgs.includes("--no-index"));
    if (!unignored) return;
    const hasPatternFlag = grepArgs.some((a) => a === "-e" || a === "-f");
    const gp = positionals(grepArgs, ["-e", "-f", "-A", "-B", "-C", "-m", "--max-count", "--max-depth", "--threads", "-O"]);
    const targets = hasPatternFlag ? gp : gp.slice(1);
    // git -C <dir>, --work-tree 는 작업 디렉터리를 바꾸므로 상대 경로 대상은 프로젝트 범위로 본다.
    const chdir = args.slice(0, args.indexOf("grep")).some((a) => a === "-C" || /^--(git-dir|work-tree)(=|$)/.test(a));
    const inScope = (t) => (chdir && !path.isAbsolute(expandHome(t))) || c.isProjectScope(t);
    if (targets.length === 0 || targets.some(inScope)) c.block(text, MSG.grepRecursive);
  }
};

const gh = (c) => {
  if (c.args[0] === "pr" && c.args[1] === "create" && schemaChangedVsMain(c.projectDir)) c.ask(MSG.schemaPush);
};

const FIND_EXEC = ["-exec", "-execdir", "-ok", "-okdir"];
const FIND_NAME = ["-name", "-iname"];
const FIND_PATH = ["-path", "-ipath", "-wholename", "-iwholename"];
const FIND_REGEX = ["-regex", "-iregex"];
const FIND_WRITE = ["-fprint", "-fprint0", "-fls", "-fprintf"];
// find 식 요소(GNU, BSD)의 인자 개수. 여기 없는 요소가 있으면 식을 해석하지 못한 것으로 보고 막는 쪽으로 판정한다.
const FIND_ARITY = new Map([
  ...[
    "-true", "-false", "-empty", "-executable", "-readable", "-writable", "-nouser", "-nogroup", "-prune", "-quit",
    "-print", "-print0", "-ls", "-delete", "-depth", "-d", "-mount", "-xdev", "-follow", "-noleaf",
    "-ignore_readdir_race", "-noignore_readdir_race", "-daystart", "-warn", "-nowarn",
  ].map((a) => [a, 0]),
  ...[
    ...FIND_NAME, ...FIND_PATH, ...FIND_REGEX, "-lname", "-ilname", "-type", "-xtype", "-size", "-perm", "-user", "-group",
    "-uid", "-gid", "-links", "-inum", "-samefile", "-newer", "-anewer", "-cnewer", "-mtime", "-atime", "-ctime", "-mmin",
    "-amin", "-cmin", "-used", "-maxdepth", "-mindepth", "-fstype", "-regextype", "-printf", "-fprint", "-fprint0", "-fls",
  ].map((a) => [a, 1]),
  ["-fprintf", 2],
]);
const findArity = (a) => FIND_ARITY.get(a) ?? (/^-newer[aBcmt][aBcmt]$/.test(a) ? 1 : undefined);

// find 식을 트리로 읽는다. 우선순위: ( ) > ! -not > -a -and(생략 가능) > -o -or > ","
// 노드: { t: "test", op, arg } | { t: "action", op, words } | { t: "not" | "group", kid } | { t: "and" | "or" | "comma", kids } | { t: "unknown" }
const parseFind = (expr) => {
  let k = 0;
  let unmodeled = false;
  const primary = () => {
    const a = expr[k];
    if (a === undefined) {
      unmodeled = true;
      return { t: "unknown" };
    }
    if (a === "(") {
      k++;
      const kid = comma();
      if (expr[k] === ")") k++;
      else unmodeled = true;
      return { t: "group", kid };
    }
    if (FIND_EXEC.includes(a)) {
      // ; 나 {} 바로 뒤의 + 까지가 명령이다(-ok/-okdir 는 ; 만).
      let end = k + 1;
      while (end < expr.length && !(expr[end] === ";" || (expr[end] === "+" && expr[end - 1] === "{}" && !a.startsWith("-ok")))) end++;
      const node = { t: "action", op: a, words: expr.slice(k + 1, end) };
      k = end + 1;
      return node;
    }
    const n = findArity(a);
    if (n === undefined || k + n >= expr.length) {
      unmodeled = true;
      k++;
      return { t: "unknown" };
    }
    const node = { t: "test", op: a, arg: expr[k + 1] };
    k += 1 + n;
    return node;
  };
  const unary = () => {
    if (expr[k] === "!" || expr[k] === "-not") {
      k++;
      return { t: "not", kid: unary() };
    }
    return primary();
  };
  const list = (t, sub, ops) => {
    const kids = [sub()];
    while (k < expr.length && ops(expr[k])) {
      if (t !== "and" || expr[k] === "-a" || expr[k] === "-and") k++;
      kids.push(sub());
    }
    return kids.length === 1 ? kids[0] : { t, kids };
  };
  const and = () => list("and", unary, (a) => ![")", "-o", "-or", ","].includes(a));
  const or = () => list("or", and, (a) => a === "-o" || a === "-or");
  const comma = () => list("comma", or, (a) => a === ",");
  const tree = expr.length ? comma() : null;
  if (k < expr.length) unmodeled = true; // 짝 없는 ) 등
  return { tree, unmodeled };
};

const find = (c) => {
  const { args, text } = c;
  // 앞쪽 전역 옵션: -H -L -P, BSD 의 -E -X -d -s -x 와 -f <시작 경로>, GNU 의 -D <옵션>, -O<n>
  const starts = [];
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (/^-[HLPEXdsx]+$/.test(a) || /^-O\d*$/.test(a)) i++;
    else if (a === "-D") i += 2;
    else if (a === "-f") {
      starts.push(args[i + 1] ?? ".");
      i += 2;
    } else if (a === "--") {
      i++;
      break;
    } else break;
  }
  while (i < args.length && !args[i].startsWith("-") && !["(", "!", ",", ")"].includes(args[i])) starts.push(args[i++]);
  const expr = args.slice(i);
  const { tree, unmodeled } = parseFind(expr);
  const inProject = (starts.length ? starts : ["."]).some(c.isProjectScope);

  // 이름/경로 필터가 .env 를 잡는지(some), 모든 .env 이름을 잡는지(every). 정규식이 깨지면 해석하지 못한 것으로 본다.
  let badRegex = false;
  const envHits = (n) => {
    const icase = n.op.startsWith("-i");
    const candidates = FIND_NAME.includes(n.op) ? ENV_NAMES : (starts.length ? starts : ["."]).flatMap((s) => ENV_NAMES.map((e) => `${s.replace(/\/+$/, "")}/${e}`));
    const match = (name) => {
      if (!FIND_REGEX.includes(n.op)) return fnmatch(n.arg, name, icase);
      try {
        return new RegExp(`^(?:${n.arg})$`, icase ? "i" : "").test(name);
      } catch {
        badRegex = true;
        return false;
      }
    };
    return { some: candidates.some(match), every: candidates.every(match) };
  };
  const isFilter = (n) => n?.t === "test" && [...FIND_NAME, ...FIND_PATH, ...FIND_REGEX].includes(n.op);
  // 노드가 참이면 그 파일이 .env 가 아님이 보장되는지(필터를 거쳤는지)
  const guarded = (n) => {
    if (!n) return false;
    if (isFilter(n)) return !envHits(n).some;
    if (n.t === "not") return isFilter(n.kid) && envHits(n.kid).every; // -not -name '.env*'
    if (n.t === "group") return guarded(n.kid);
    if (n.t === "and") return n.kids.some(guarded);
    if (n.t === "or") return n.kids.every(guarded);
    if (n.t === "comma") return guarded(n.kids.at(-1));
    return false;
  };
  // 각 -exec 가 실행되는 갈래가 필터를 거치는지. -a 로 이어진 앞쪽 요소만 제한이 된다(-o, "," 의 다른 갈래, 뒤쪽 요소는 아님).
  const actions = [];
  const envFilters = [];
  const visit = (n, g, negated) => {
    if (!n) return;
    if (n.t === "and") {
      let run = g;
      for (const kid of n.kids) {
        visit(kid, run, negated);
        run = run || guarded(kid);
      }
    } else if (n.t === "or" || n.t === "comma") n.kids.forEach((kid) => visit(kid, g, negated));
    else if (n.t === "not") visit(n.kid, g, !negated);
    else if (n.t === "group") visit(n.kid, g, negated);
    else if (n.t === "action") actions.push({ ...n, guarded: g });
    else if (n.t === "test") {
      if (FIND_WRITE.includes(n.op) && isEnvPath(n.arg)) c.block(text, MSG.envRead); // -fprint .env 는 .env 를 덮어쓴다
      if (!negated && ((isFilter(n) && envHits(n).some) || isEnvPath(n.arg ?? ""))) envFilters.push(n);
    }
  };
  visit(tree, false, false);
  const hasExec = expr.some((a) => FIND_EXEC.includes(a));
  if (!hasExec) return;
  // find … -name .env -exec cat {} \; : 찾은 .env 를 다른 명령에 넘긴다.
  if (envFilters.length) {
    c.block(text, MSG.envRead);
    return;
  }
  if ((unmodeled || badRegex) && inProject) {
    c.block(text, MSG.findUnmodeled);
    return;
  }
  for (const act of actions) {
    // {} 앞의 단어에 읽기 도구, 셸, 인터프리터가 있으면 찾은 파일을 읽는 것으로 본다(-exec sh -c 'cat "$1"' _ {} 포함).
    const brace = act.words.findIndex((x) => x.includes("{}"));
    const head = brace === -1 ? act.words : act.words.slice(0, brace);
    const reads = head.some((x) => READERS.has(base(x)) || SHELLS.has(base(x)) || Object.hasOwn(INTERPRETERS, base(x)));
    if (reads && !act.guarded && inProject) {
      c.block(text, MSG.findExecRead);
      return;
    }
  }
  // -execdir/-okdir 는 찾은 파일의 디렉터리에서 실행되므로 안쪽 명령의 상대 경로는 작업 디렉터리를 모르는 것으로 본다.
  for (const act of actions) c.recurse(act.words, { cwdUnknown: act.op.endsWith("dir") });
};

// node / bun / deno / tsx / ts-node 공통 옵션. 판정을 끝냈으면 true.
const jsRuntime = (c) => {
  const { cmd, args, text } = c;
  const valueOf = (a, k) => (a.includes("=") ? a.slice(a.indexOf("=") + 1) : args[k + 1] ?? "");
  // Node 24: node --run <script> 은 package.json 스크립트를 실행한다(npm run 과 같게 판정).
  const runAt = cmd === "node" ? args.findIndex((a) => /^--run(=|$)/.test(a)) : -1;
  if (runAt !== -1) {
    c.runScript(valueOf(args[runAt], runAt), text);
    return true;
  }
  if (args.some((a, k) => /^--env-file(-if-exists)?(=|$)/.test(a) && isEnvPath(valueOf(a, k)))) {
    c.block(text, MSG.envRead);
    return true;
  }
  // node -r dotenv/config …, --import dotenv/config : .env 를 불러온 채 실행한다.
  if (args.some((a, k) => PRELOAD_FLAGS.test(a) && LOADS_DOTENV.test(valueOf(a, k)))) {
    c.block(text, MSG.dotenvEval);
    return true;
  }
  return false;
};

// -e/-c 로 코드를 실행하는 인터프리터
const interpreter = (c) => {
  const { cmd, args, text } = c;
  const flags = INTERPRETERS[cmd];
  // perl -ne / -pe / -lne, ruby -ne 처럼 묶인 짧은 옵션이 e 로 끝나면 다음 인자가 코드다.
  const isEval = (a) =>
    flags.includes(a) || ((cmd === "perl" || cmd === "ruby") && /^-[a-zA-Z]+$/.test(a) && flags.some((f) => a.endsWith(f.slice(1))));
  const codeAt = new Set();
  args.forEach((a, k) => {
    if (!isEval(a)) return;
    codeAt.add(k + 1);
    const code = args[k + 1] ?? "";
    if (/(^|[^\w$.])\.env(?!\w|\.(example|sample|template)\b)/.test(code)) c.block(`${cmd} ${a} …`, MSG.envRead);
    // require('dotenv').config(), import 'dotenv/config', import prisma.config, 또는 dotenv 래퍼 아래에서 실행하는 코드
    else if (LOADS_DOTENV.test(code) || c.envLoaded) c.block(`${cmd} ${a} …`, MSG.dotenvEval);
  });
  // perl -ne print .env, python3 x.py .env 처럼 .env 를 입력 파일로 넘기는 경우
  if (args.some((a, k) => !codeAt.has(k) && isEnvArg(a))) c.block(text, MSG.envRead);
};

const AG_VALUE_FLAGS = ["-A", "-B", "-C", "-G", "-g", "-m", "-p", "--depth", "--ignore", "--ignore-dir", "--path-to-ignore", "--max-count", "--context"];
// cat/grep/cp 같은 읽기 도구. .env 인자, 프로젝트 루트 재귀 검색, ignore 무시 검색을 막는다.
const reader = (c) => {
  const { cmd, args, text } = c;
  const target = args.find((a) => isEnvArg(a) || (a.startsWith("--") && a.includes("=") && isEnvArg(a.split("=").pop()) && !a.startsWith("--exclude")));
  if (target) {
    c.block(text, MSG.envRead);
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
    if (targets.length === 0 ? c.isProjectScope(".") : targets.some(c.isProjectScope)) c.block(text, MSG.grepRecursive);
    return;
  }
  if (cmd === "rg") {
    const u = args.filter((a) => /^-[a-zA-Z]*u/.test(a) && !a.startsWith("--")).reduce((n, a) => n + (a.match(/u/g) ?? []).length, 0);
    const hidden = u >= 2 || args.includes("--hidden") || args.includes("-.");
    const noIgnore = u >= 1 || args.some((a) => a.startsWith("--no-ignore"));
    if (hidden && noIgnore) c.block(text, MSG.grepRecursive);
    return;
  }
  if (cmd === "ag") {
    // ag 는 기본으로 숨김 파일과 .gitignore 대상(.env)을 건너뛴다. -u 나 --hidden + ignore 무시 조합만 막는다.
    const shorts = args.filter((a) => /^-[a-zA-Z]+$/.test(a)).join("");
    const unrestricted = shorts.includes("u") || args.includes("--unrestricted");
    const skipIgnores = /[aU]/.test(shorts) || args.includes("--all-types") || args.includes("--skip-vcs-ignores");
    if (!unrestricted && !(args.includes("--hidden") && skipIgnores)) return;
    const targets = positionals(args, AG_VALUE_FLAGS).slice(1);
    if (targets.length === 0 ? c.isProjectScope(".") : targets.some(c.isProjectScope)) c.block(text, MSG.grepRecursive);
  }
};

const HANDLERS = {
  eval: (c) => c.runLexed(c.args.join(" ")),
  npx: packageRunner,
  bunx: packageRunner,
  pnpx: packageRunner,
  npm: packageManager,
  pnpm: packageManager,
  yarn: packageManager,
  bun: packageManager,
  "vercel-build": (c) => c.block(c.text, MSG.vercelBuild),
  prisma,
  next,
  vercel,
  vc: vercel,
  git,
  gh,
  find,
};

// ---------- 세그먼트 분석 ----------
export const analyze = (command, { projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd() } = {}) => {
  const blocks = [];
  const asks = []; // 사용자 확인이 필요한 명령 (permissionDecision: ask)
  // cwd: 같은 명령 문자열 안에서 앞선 `cd <dir> &&` 로 바뀐 작업 디렉터리(최상위 세그먼트만 추적, 논리 경로).
  // cwdUnknown: 따라갈 수 없는 cd/pushd/popd(서브셸, bash -c, 변수 대상, ; 뒤 등)가 앞에 있어 작업 디렉터리를 모르는 상태.
  const ctx = { exportedSafeDb: false, vars: new Map(), cwd: projectDir, cwdUnknown: false };
  const root = path.resolve(projectDir);
  const rootReal = realish(root);
  // CDPATH(zsh 는 cdpath 배열)가 있으면 상대 경로 cd 가 다른 곳으로 갈 수 있고, HOME 을 바꾸면 cd / ~ 가 다른 곳이다.
  // 명령 어디에든 이름이 보이면(따옴표 안 포함) 그 cd 는 따라가지 않는다.
  const cdpathRisk = /cdpath/i.test(command) || Boolean(process.env.CDPATH);
  const homeRisk = /(^|[^\w])HOME=/.test(command);
  const blockedDbScript = realOrResolved(path.join(root, BLOCKED_DB_SCRIPT));

  // git worktree 의 최상위 경로와 공통 git 디렉터리. 실패하면 null.
  const gitInfoCache = new Map();
  const gitInfo = (dir) => {
    if (!gitInfoCache.has(dir)) {
      let info = null;
      try {
        const r = spawnSync("git", ["-C", dir, "rev-parse", "--path-format=absolute", "--show-toplevel", "--git-common-dir"], { encoding: "utf8", timeout: 3000 });
        const [top, common] = r.status === 0 ? r.stdout.trim().split("\n") : [];
        if (top && common) info = { top: realOrResolved(top), common: realOrResolved(common) };
      } catch {
        info = null;
      }
      gitInfoCache.set(dir, info);
    }
    return gitInfoCache.get(dir);
  };
  // 프로젝트의 scripts/with-blocked-db.mjs 이거나, 같은 저장소의 다른 worktree(.claude/worktrees/* 등) 루트의 그 파일인지.
  const isBlockedDbScript = (abs) => {
    const real = realOrResolved(abs);
    if (real === blockedDbScript) return true;
    if (!real.endsWith(`/${BLOCKED_DB_SCRIPT}`)) return false;
    const wtRoot = path.dirname(path.dirname(real));
    if (!existsSync(path.join(wtRoot, ".git"))) return false;
    const wt = gitInfo(wtRoot);
    const main = gitInfo(root);
    return Boolean(wt && main && wt.top === wtRoot && wt.common === main.common);
  };

  const block = (what, msg) => blocks.push(`- \`${what}\`: ${msg}`);
  const ask = (msg) => asks.push(msg);

  // 같은 명령 문자열 안에서 앞서 대입한 변수(P=prisma; npx $P …)와 알려진 셸 변수($HOME, $PWD, $CLAUDE_PROJECT_DIR)를 펼친다.
  // 모르는 변수는 그대로 둔다.
  const known = (name) => {
    if (ctx.vars.has(name)) return ctx.vars.get(name);
    if (name === "HOME") return os.homedir();
    if (name === "PWD") return ctx.cwdUnknown ? undefined : ctx.cwd;
    if (name === "CLAUDE_PROJECT_DIR") return root;
    return undefined;
  };
  const subst = (s) => (s.includes("$") ? s.replace(/\$\{([A-Za-z_]\w*)\}|\$([A-Za-z_]\w*)/g, (m, a, b) => known(a ?? b) ?? m) : s);

  // target 이 프로젝트 루트이거나 그 상위 디렉터리인지(재귀 검색하면 .env 가 포함된다).
  // 작업 디렉터리를 모르면(unknown: env -C 같은 래퍼, -execdir) 상대 경로는 모두 프로젝트 범위로 본다.
  // 논리 경로와 실제 경로(심볼릭 링크, link/.. 를 커널처럼 푼 것)를 모두 보고 하나라도 걸리면 프로젝트 범위다.
  const isProjectScope = (target, unknown = false) => {
    if (isOtherTilde(target) || (homeRisk && target.startsWith("~"))) return true;
    const p = expandHome(target);
    if ((ctx.cwdUnknown || unknown) && !path.isAbsolute(p)) return true;
    const logical = path.resolve(ctx.cwd, p);
    const real = physical(path.isAbsolute(p) ? p : `${ctx.cwd}/${p}`) ?? realish(logical);
    return [logical, real].some((t) => containsPath(t, root) || containsPath(t, rootReal));
  };

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
    let cwdUnknown = Boolean(state.cwdUnknown); // env -C, sudo -D 처럼 이 명령만 다른 디렉터리에서 실행되는 상태
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
      else if (head === "env") {
        // env -C/--chdir 는 감싼 명령의 작업 디렉터리를 바꾸고, -S 는 문자열을 나눠 명령으로 쓴다.
        const { j, opts } = wrapperOpts(w, "uCS", { "--unset": "u", "--chdir": "C", "--split-string": "S" });
        if (opts.some(([o]) => o === "C")) cwdUnknown = true;
        const split = opts.filter(([o]) => o === "S").flatMap(([, v]) => lex(v, depth + 1).flatMap((x) => x.words.map((y) => y.value)));
        w = [...split, ...w.slice(j)];
      } else if (head === "sudo") {
        // sudo -D/--chdir 는 작업 디렉터리를, -i/--login 은 홈으로, -R/--chroot 는 루트를 바꾼다.
        const { j, opts } = wrapperOpts(w, "ugCDprtUTR", {
          "--user": "u", "--group": "g", "--close-from": "C", "--chdir": "D", "--prompt": "p", "--role": "r", "--type": "t",
          "--other-user": "U", "--command-timeout": "T", "--chroot": "R", "--host": "h",
        });
        if (opts.some(([o]) => ["D", "i", "R", "--login"].includes(o))) cwdUnknown = true;
        w = w.slice(j);
      } else if (head === "nice" || head === "stdbuf" || head === "timeout" || head === "watch") {
        let j = 1;
        const valueFlags = { nice: ["-n"], watch: ["-n", "-d"], timeout: ["-s", "-k"], stdbuf: ["-i", "-o", "-e"] }[head] ?? [];
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
        // 프로젝트(또는 같은 저장소 worktree)의 scripts/with-blocked-db.mjs 로 해석될 때만 DB 차단으로 본다.
        // 같은 이름의 다른 파일이나 작업 디렉터리를 모르는 상태의 상대 경로는 안쪽 명령만 그대로 검사한다.
        const script = expandHome(w[1]);
        blockedDb = blockedDb || (!((ctx.cwdUnknown || cwdUnknown) && !path.isAbsolute(script)) && isBlockedDbScript(path.resolve(ctx.cwd, script)));
        w = w.slice(2);
        if (w[0] === "--preview") w = w.slice(1);
      } else if ((head === "node" || head === "bun") && w[1] && binFromPath(w[1])) {
        // node node_modules/prisma/build/index.js …, node node_modules/.bin/next … 는 해당 CLI 로 본다.
        w = [binFromPath(w[1]), ...w.slice(2)];
      } else break;
    }

    if (w[0].includes("$")) {
      // P=… 가 이전 Bash 호출에서 대입됐거나 명령 치환 결과라 이름을 알 수 없다.
      ask(`${MSG.varCommand} (\`${w.join(" ")}\`)`);
      return;
    }
    const cmd = base(w[0]).replace(/^(.+)@[^/]*$/, "$1");
    // 최상위 `cd … &&` 말고는 작업 디렉터리 변경을 따라가지 않는다(서브셸, bash -c, eval, builtin cd, pushd/popd).
    if (CD_COMMANDS.has(cmd) && !state.topCd) ctx.cwdUnknown = true;
    // zsh 의 AUTO_CD(인자 없이 디렉터리 이름만 쓴 명령은 cd 다)와 oh-my-zsh 의 cd 별칭(.., ..., -, 1~9)
    if (!CD_COMMANDS.has(cmd) && w.length === 1 && w[0] !== "." && (/^(\.{2,}\/?|-|\d)$/.test(w[0]) || w[0].startsWith("~") || isDirectory(path.resolve(ctx.cwd, w[0])))) {
      ctx.cwdUnknown = true;
    }
    const inner = { assigned, blockedDb, envLoaded, cwdUnknown };
    const c = {
      cmd,
      args: w.slice(1),
      text: w.join(" "),
      redirs,
      heredocs,
      pipedFrom,
      inner,
      envLoaded,
      projectDir: root,
      block,
      ask,
      subst,
      isProjectScope: (target) => isProjectScope(target, cwdUnknown),
      recurse: (nextWords, extra = {}) => runSegment(nextWords.map((value) => ({ value })), [], [], { ...inner, ...extra, cwdUnknown: cwdUnknown || extra.cwdUnknown }, depth + 1),
      runLexed: (src) => runLexed(src, inner, depth),
      realDbServer: (what) => {
        if (blockedDb || assigned.has("POSTGRES_PRISMA_URL") || ctx.exportedSafeDb) return;
        block(what, MSG.realDbServer);
      },
    };
    // package.json 스크립트 실행(npm run, node --run 등) 판정
    c.runScript = (script, what) => {
      if (script === "vercel-build") block(what, MSG.vercelBuild);
      else if (script === "dev" || script === "start") c.realDbServer(what);
    };

    if (SHELLS.has(cmd)) return shell(c);
    if (Object.hasOwn(HANDLERS, cmd)) return HANDLERS[cmd](c);
    if (JS_RUNTIMES.has(cmd) && jsRuntime(c)) return;
    if (Object.hasOwn(INTERPRETERS, cmd)) return interpreter(c);
    if (READERS.has(cmd)) return reader(c);
  };

  // 최상위 `cd <dir> &&` 의 대상. 셸과 다르게 해석할 여지가 있으면 작업 디렉터리를 모르는 것으로 둔다:
  // 모르는 옵션, 인자 2개 이상(zsh 의 cd old new), - / +N / -N(디렉터리 스택), ~user ~+ ~-, 변수나 명령 치환,
  // CDPATH/HOME 을 바꾼 명령, 없는 디렉터리, 논리 경로와 실제 경로가 다른 경우(link/.. 를 cd -P 나 zsh CHASE_LINKS 가 다르게 푼다).
  const applyCd = (args) => {
    const unknown = () => {
      ctx.cwdUnknown = true;
    };
    let i = 0;
    for (; i < args.length && isFlag(args[i]); i++) {
      if (args[i] === "--") {
        i++;
        break;
      }
      if (!/^-[LPe@qs]+$/.test(args[i])) return unknown();
    }
    const rest = args.slice(i);
    if (rest.length > 1) return unknown();
    const dir = rest[0] ?? "~";
    if (cdpathRisk || /^[-+]\d*$/.test(dir) || /[$`…]/.test(dir) || isOtherTilde(dir)) return unknown();
    if (dir.startsWith("~") && homeRisk) return unknown();
    const p = expandHome(dir);
    if (ctx.cwdUnknown && !path.isAbsolute(p)) return;
    const logical = path.resolve(ctx.cwd, p);
    const real = physical(path.isAbsolute(p) ? p : `${ctx.cwd}/${p}`);
    if (!real || !isDirectory(real) || real !== realish(logical)) return unknown();
    ctx.cwd = logical;
    ctx.cwdUnknown = false;
  };

  // && || ; 목록을 따라 cd 가 실제로 실행됐다고 볼 수 있는 구간에서만 cwd 를 바꾼다.
  // - cd 는 같은 목록 안에서 앞 연산자가 모두 && 이고(|| 뒤나 그룹 뒤가 아님) 자신도 && 로 끝날 때만 따라간다.
  //   `cd x; …`, `cd x\n…` 는 cd 가 실패해도 다음 명령이 원래 디렉터리에서 실행되므로 따라가지 않는다.
  // - 따라간 cd 뒤에 || 가 오거나 목록이 끝나면(; 개행 &) cd 가 실패했을 수 있으므로 작업 디렉터리를 모르는 것으로 바꾼다.
  // $( ) 안쪽 세그먼트는 그 바깥 세그먼트(뒤에 오는 첫 비중첩 세그먼트)의 앞 연산자로 판정한다.
  const segs = lex(command);
  const boundary = [];
  for (let k = segs.length - 1, owner; k >= 0; k--) {
    if (!segs[k].nested) owner = segs[k].prevOp;
    boundary[k] = owner;
  }
  let chainOk = true;
  let cdInList = false;
  segs.forEach((seg, k) => {
    const op = boundary[k];
    if (op === undefined || [";", ";;", "\n", "&"].includes(op)) {
      if (cdInList) ctx.cwdUnknown = true;
      cdInList = false;
      chainOk = true;
    } else if (op !== "&&") {
      chainOk = false;
      if (cdInList && op !== "|" && op !== "|&") ctx.cwdUnknown = true;
    }
    const tracked = !seg.grouped && !seg.pipedFrom && chainOk && seg.op === "&&" && seg.words[0]?.value === "cd";
    runSegment(seg.words, seg.redirs, seg.heredocs, { assigned: new Set(), blockedDb: false, envLoaded: false, topCd: tracked }, 0, seg.pipedFrom);
    if (tracked) {
      applyCd(seg.words.slice(1).map((x) => subst(x.value)));
      cdInList = true;
    }
  });
  return { blocks: [...new Set(blocks)], asks: [...new Set(asks)] };
};
