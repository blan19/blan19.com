#!/usr/bin/env node
// 콘텐츠 검사기 테스트. 실행: npm run test:content (node:test, 의존성 없음, 실패하면 exit 1)
// - 규칙 함수(scripts/content/*.mjs)는 입력/기대 표로 검사한다.
// - CLI(scripts/validate-content.mjs)는 임시 디렉터리에 contents/ 픽스처를 만들어 --root 로 실행한다.
// 규칙을 고치거나 추가하면 여기에 케이스를 추가한다.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { FIXED_PAGE_IDS, checkLogBody, checkTechBody, checkTodo } from "./body.mjs";
import { loadContext } from "./context.mjs";
import { checkFrontmatter, parseFrontmatter } from "./frontmatter.mjs";
import { checkImageMeta, isAllowedRemote } from "./images.mjs";
import { ROOT } from "../lib/paths.mjs";

const ctx = await loadContext();
// 로컬 이미지 케이스는 저장소 public/ 대신 임시 public/ 픽스처(image/sample.png 하나)를 본다.
const fixturePublic = mkdtempSync(path.join(os.tmpdir(), "validate-content-public-"));
mkdirSync(path.join(fixturePublic, "image"));
writeFileSync(path.join(fixturePublic, "image/sample.png"), "");
after(() => rmSync(fixturePublic, { recursive: true, force: true }));
const bodyCtx = { ...ctx, publicDir: fixturePublic };
const VALID = { title: "t", description: "d", publishedAt: "2024-01-01", tags: ["a"], reference: [] };
// 결과를 "level: 메시지 일부" 로 비교한다. expected 는 [level, 메시지에 들어 있어야 할 문자열] 목록.
const assertProblems = (got, expected) => {
  assert.equal(got.length, expected.length, `문제 수가 다름: ${JSON.stringify(got, null, 1)}`);
  expected.forEach(([level, text], i) => {
    assert.equal(got[i].level, level, `${i}번째 level: ${got[i].message}`);
    assert.ok(got[i].message.includes(text), `${i}번째 메시지에 "${text}" 없음: ${got[i].message}`);
  });
};

describe("ctx", () => {
  test("languages.ts 와 next.config.js 를 읽는다", () => {
    assert.deepEqual(ctx.setupProblems, []);
    assert.ok(ctx.langs.CODE_LANGUAGES.includes("typescript"));
    assert.ok(ctx.remotePatterns.length > 0);
  });
  test("고정 id 는 src/lib/page-ids.ts 에서 읽는다", () => {
    assert.deepEqual(FIXED_PAGE_IDS, ["main", "post-head", "post-body", "footnote-label", "ref-label", "cm-label"]);
  });
});

describe("checkFrontmatter", () => {
  const cases = [
    ["올바른 frontmatter", VALID, "2024-01-01", []],
    ["title 없음", { ...VALID, title: "" }, null, [["error", "title 이 없거나"]]],
    ["description 없음", { ...VALID, description: undefined }, null, [["error", "description 이 없거나"]]],
    ["publishedAt 없음", { ...VALID, publishedAt: undefined }, null, [["error", "publishedAt 이 없음"]]],
    ["publishedAt Date", { ...VALID, publishedAt: new Date("2024-01-01") }, null, [["error", "따옴표 없이"]]],
    ["publishedAt 없는 날짜", { ...VALID, publishedAt: "2024-02-30" }, null, [["error", "올바른 \"YYYY-MM-DD\""]]],
    ["폴더 날짜와 다름", VALID, "2024-01-02", [["warn", "폴더 날짜(2024-01-02)"]]],
    ["알 수 없는 필드", { ...VALID, draft: true }, null, [["warn", "알 수 없는 frontmatter 필드 \"draft\""]]],
    ["tags 빈 배열", { ...VALID, tags: [] }, null, [["error", "tags 는 비어 있지 않은"]]],
    ["tags 빈 항목과 중복", { ...VALID, tags: ["a", ""] }, null, [["error", "모든 항목"]]],
    ["tags 중복", { ...VALID, tags: ["a", "a"] }, null, [["warn", "tags 에 중복"]]],
    ["reference 없음", { ...VALID, reference: undefined }, null, [["error", "reference 가 없음"]]],
    ["reference 문자열", { ...VALID, reference: "https://x.dev" }, null, [["error", "URL 문자열 배열"]]],
    ["reference http 아님", { ...VALID, reference: ["ftp://x.dev"] }, null, [["error", "http(s) URL 이 아님"]]],
    ["reference 중복", { ...VALID, reference: ["https://x.dev", "https://x.dev"] }, null, [["warn", "중복 URL"]]],
  ];
  for (const [name, data, folderDate, expected] of cases) {
    test(name, () => assertProblems(checkFrontmatter(data, folderDate), expected));
  }
});

describe("parseFrontmatter", () => {
  test("YAML frontmatter 와 본문 시작 행", () => {
    const r = parseFrontmatter('---\ntitle: "t"\n---\n\nbody\n');
    assert.deepEqual(r.problems, []);
    assert.equal(r.data.title, "t");
    assert.equal(r.bodyStartLine, 4);
  });
  test("frontmatter 없음", () => {
    assertProblems(parseFrontmatter("body\n").problems, [["error", "frontmatter 가 없음"]]);
  });
  test("---js frontmatter 는 실행하지 않고 error", () => {
    const r = parseFrontmatter('---js\n{ title: (globalThis.__contentTestEval = 1, "t") }\n---\nbody\n');
    assert.equal(globalThis.__contentTestEval, undefined);
    assert.equal(r.data, null);
    assertProblems(r.problems, [["error", "YAML 만 허용"]]);
  });
  test("YAML 파싱 실패", () => {
    assertProblems(parseFrontmatter("---\ntitle: [\n---\n").problems, [["error", "YAML 파싱 실패"]]);
  });
});

describe("checkTechBody", () => {
  const cases = [
    ["지원 언어, 별칭, text, mermaid", "```ts\nx\n```\n\n```js\n```\n\n```text\n```\n\n```mermaid\n```\n", []],
    ["언어 없음", "```\nx\n```\n", [["warn", "1행: 언어가 지정되지 않은"]]],
    ["모르는 언어", "```cobol\nx\n```\n", [["warn", "\"cobol\" 는 하이라이트되지 않음 (지원: bash,"]]],
    ["대문자 언어는 소문자로 판정", "```TS\nx\n```\n", []],
    ["title 형식", "```ts title=a.ts\n```\n", [["warn", "title=\"파일명\""]]],
    ["닫히지 않은 코드 블록", "```ts\nx\n", [["warn", "닫히지 않은 코드 블록"]]],
    ["코드 블록 안의 제목은 무시", "```ts\n# x\n```\n", []],
    ["## 제목", "## 섹션\n", [["warn", "`#`/`##`"]]],
    ["##### 제목", "##### 작은 제목\n", [["warn", "목차에 나오지 않음"]]],
    ["고정 id 와 겹치는 제목", "### Main\n", [["warn", "앵커 id \"main\""]]],
    ["고정 id 와 비슷한 제목", "### main 1\n### Post Body x\n", []],
    ["같은 제목 두 번째는 -1 이 붙는다", "### 요약\n### 요약\n### Main\n### Main\n", [["warn", "앵커 id \"main\""]]],
    ["모르는 콜아웃", "> [!INFO]\n> x\n", [["warn", "알 수 없는 콜아웃 타입 [!INFO]"]]],
    ["콜아웃 마커 뒤 평문", "> [!NOTE] 제목\n", [["warn", "마커 뒤 같은 줄에 텍스트"]]],
    ["콜아웃 마커 뒤 굵게는 허용", "> [!NOTE] **제목**\n", []],
    ["각주 정의 없음", "본문[^1]\n", [["warn", "각주 [^1] 의 정의"]]],
    ["각주 참조 없음", "본문\n\n[^a]: 설명\n", [["warn", "각주 정의 [^a] 를 참조하는 곳이 없음"]]],
    ["각주 대소문자 무시, 인라인 코드 안은 무시", "본문[^A] `[^b]`\n\n[^a]: 설명\n", []],
    ["문단 중간 이미지", "글 ![설명](/image/sample.png)\n", [["warn", "문단 중간의 이미지"]]],
    ["이미지 뒤 텍스트", "![설명](/image/sample.png) 뒤\n", [["error", "나머지 텍스트는 렌더되지 않고"]]],
    ["로컬 이미지 있음", "![설명 {768x432}](/image/sample.png)\n", []],
    ["로컬 이미지 없음", "![설명](/image/none.png)\n", [["error", "public/image/none.png 파일이 없음"]]],
    ["허용 원격 이미지", "![설명](https://github.com/blan19/blan19.xyz/assets/1/x.png)\n", []],
    ["새 GitHub 첨부 이미지", "![설명](https://github.com/user-attachments/assets/abc)\n", []],
    ["허용되지 않은 원격 이미지", "![설명](https://example.com/x.png)\n", [["error", "remotePatterns 에 맞지 않음 (허용: github.com/blan19/** (쿼리 없음), github.com/user-attachments/** (쿼리 없음))"]]],
    ["허용 호스트의 다른 경로", "![설명](https://github.com/someone/repo/assets/1/x.png)\n", [["error", "https://github.com/someone/repo/assets/1/x.png 는"]]],
    ["허용 경로에 쿼리", "![설명](https://github.com/blan19/blan19.xyz/assets/1/x.png?v=2)\n", [["error", "x.png?v=2 는"]]],
    ["상대 경로 이미지", "![설명](image/x.png)\n", [["error", "https URL 이거나 public 기준"]]],
    ["참조 형식 이미지", "![설명][ref]\n", [["warn", "참조 형식 이미지"]]],
  ];
  for (const [name, body, expected] of cases) {
    test(name, () => assertProblems(checkTechBody(body, 1, bodyCtx), expected));
  }
  test("bodyStartLine 만큼 행 번호를 민다", () => {
    assertProblems(checkTechBody("x\n```\n```\n", 10, ctx), [["warn", "11행:"]]);
  });
  test("next.config.js 를 못 읽으면 원격 이미지마다 이유를 쓴다", () => {
    const broken = { ...ctx, remotePatterns: [], remoteError: "boom" };
    assertProblems(checkTechBody("![설명](https://github.com/blan19/x.png)\n", 1, broken), [["error", "next.config.js 를 읽지 못함: boom"]]);
  });
});

describe("checkImageMeta", () => {
  const cases = [
    ["메타 없음", "설명", []],
    ["허용 토큰", "설명 {priority} {caption: 캡션} {768x432}", []],
    ["중괄호 짝", "설명 {768x432", [["error", "짝이 맞지 않음"]]],
    ["중첩", "설명 {a {b}}", [["error", "중첩"]]],
    ["캡션 형식", "설명 {Caption:x}", [["warn", "캡션 형식이 틀려"]]],
    ["모르는 토큰", "설명 {big}", [["warn", "알 수 없는 alt 메타 {big}"]]],
    ["설명 없음", "{768x432}", [["error", "alt 설명 텍스트가 없음"]]],
    ["크기 0", "설명 {0x432}", [["error", "0 이 있음"]]],
    ["높이 0", "설명 {768x00}", [["error", "크기 {768x00} 에 0 이 있음"]]],
    ["두 번째 크기의 0 은 렌더러가 읽지 않는다", "설명 {1x2} {0x0}", [["warn", "크기 토큰이 2개"]]],
    ["크기 두 개", "설명 {1x2} {3x4}", [["warn", "크기 토큰이 2개"]]],
  ];
  for (const [name, alt, expected] of cases) {
    test(name, () => assertProblems(checkImageMeta(1, alt), expected));
  }
});

describe("isAllowedRemote", () => {
  const patterns = [
    { protocol: "https", hostname: "**.example.com", pathname: "/img/**" },
    { hostname: "*.cdn.dev", port: "8080" },
    { protocol: "https", hostname: "gh.dev", pathname: "/*/assets/**", search: "" },
    { hostname: "q.dev", search: "?v=1" },
  ];
  const cases = [
    ["https://a.b.example.com/img/x/y.png", true],
    ["http://a.example.com/img/x.png", false],
    ["https://a.example.com/other/x.png", false],
    ["https://x.cdn.dev:8080/a.png", true],
    ["https://x.y.cdn.dev:8080/a.png", false],
    ["https://x.cdn.dev/a.png", false],
    // 경로 glob: * 는 한 세그먼트(점 포함), ** 는 여러 세그먼트
    ["https://gh.dev/blan19.xyz/assets/1/2.png", true],
    ["https://gh.dev/a/b/assets/1.png", false],
    ["https://gh.dev/assets/1.png", false],
    // search: "" 는 쿼리 없음만, 값이 있으면 정확히 같아야 한다
    ["https://gh.dev/a/assets/1.png?x=1", false],
    ["https://q.dev/a.png?v=1", true],
    ["https://q.dev/a.png?v=2", false],
    ["https://q.dev/a.png", false],
  ];
  for (const [url, expected] of cases) {
    test(url, () => assert.equal(isAllowedRemote(new URL(url), patterns), expected));
  }
});

describe("checkLogBody / checkTodo", () => {
  test("log 글의 마크다운 문법", () => assertProblems(checkLogBody("# 제목\n"), [["warn", "원문 그대로 출력됨"]]));
  test("log 글 평문", () => assertProblems(checkLogBody("그냥 글입니다.\n"), []));
  test("TODO: 는 기본 warn", () => assertProblems(checkTodo("a\nTODO: x\n", false), [["warn", "2행: 해소되지 않은 TODO:"]]));
  test("TODO: 는 strict 에서 error", () => assertProblems(checkTodo("TODO: x\n", true), [["error", "1행:"]]));
  test("코드 블록 안 TODO: 는 무시", () => assertProblems(checkTodo("```js\n// TODO: x\n```\n", true), []));
});

// ---------- CLI: --root 픽스처 ----------
describe("validate-content.mjs --root", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "validate-content-test-"));
  after(() => rmSync(tmp, { recursive: true, force: true }));
  const write = (rel, text) => {
    mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
    writeFileSync(path.join(tmp, rel), text);
  };
  const post = ({ description = "d", body = "본문\n" } = {}) =>
    `---\ntitle: "t"\ndescription: "${description}"\npublishedAt: "2024-01-01"\ntags: ["a"]\nreference: []\n---\n\n${body}`;
  write("contents/tech/2024-01-01/good.mdx", post({ description: "good" }));
  write("contents/tech/2024-01-02/a.mdx", post({ description: "a" }));
  write("contents/tech/2024-01-02/b.mdx", post({ description: "b" }));
  write("contents/tech/not-a-date/bad-folder.mdx", post({ description: "bad-folder" }));
  write("contents/tech/stray.txt", "x");
  write("contents/log/2024-01-03/good.mdx", post({ description: "log", body: "할 일\nTODO: 채우기\n" }));
  write("contents/tech/2024-01-04/Bad_Slug.mdx", post({ description: "good" }));
  // 점 파일은 로더(src/lib/posts.ts)처럼 건너뛴다(카테고리 폴더, 날짜 폴더 모두).
  write("contents/tech/.DS_Store", "x");
  write("contents/tech/2024-01-01/.DS_Store", "x");
  write("contents/tech/2024-01-01/.draft.mdx", "x");

  const run = (...args) => {
    const r = spawnSync(process.execPath, [path.join(ROOT, "scripts/validate-content.mjs"), "--root", tmp, ...args], { encoding: "utf8" });
    return { status: r.status, lines: r.stdout.trim().split("\n"), stderr: r.stderr };
  };
  const has = (lines, prefix, text) => lines.some((l) => l.startsWith(prefix) && l.includes(text));

  test("전체 검사: 구조, slug, 중복 문제를 error/warn 으로 보고하고 exit 1", () => {
    const { status, lines, stderr } = run();
    assert.equal(status, 1);
    assert.equal(stderr, "");
    const expected = [
      ["contents/tech/2024-01-02/a.mdx: [error]", "정확히 1개여야 함 (현재 2개"],
      ["contents/tech/2024-01-02/b.mdx: [error]", "정확히 1개여야 함"],
      ["contents/tech/not-a-date: [error]", "폴더 이름 \"not-a-date\""],
      ["contents/tech/stray.txt: [error]", "날짜 폴더만 둘 수 있음"],
      ["contents/tech/2024-01-04/Bad_Slug.mdx: [error]", "파일명(slug) \"Bad_Slug\""],
      ["contents/tech/2024-01-01/good.mdx: [error]", "slug \"good\" 이 중복됨 (contents/log/2024-01-03/good.mdx)"],
      ["contents/tech/2024-01-01/good.mdx: [warn]", "description 이 다른 글과 같음 (contents/tech/2024-01-04/Bad_Slug.mdx)"],
      ["contents/log/2024-01-03/good.mdx: [warn]", "10행: 해소되지 않은 TODO:"],
      ["contents/tech/2024-01-04/Bad_Slug.mdx: [warn]", "폴더 날짜(2024-01-04)"],
    ];
    for (const [prefix, text] of expected) assert.ok(has(lines, prefix, text), `없음: ${prefix} ${text}\n${lines.join("\n")}`);
    assert.ok(!lines.some((l) => l.split(": ")[0].includes("/.")), `점 파일이 보고됨\n${lines.join("\n")}`);
    assert.match(lines.at(-1), /^콘텐츠 검사 \(글 6개\): error 7개, warn \d+개 → 실패$/);
  });

  test("--strict 는 TODO: 를 error 로 본다", () => {
    const { lines } = run("--strict", path.join(tmp, "contents/log"));
    assert.ok(has(lines, "contents/log/2024-01-03/good.mdx: [error]", "TODO:"), lines.join("\n"));
    assert.match(lines.at(-1), /\(지정 파일 1개, strict\)/);
  });

  test("지정 파일만 보고하고 contents/ 밖 경로는 무시", () => {
    assert.deepEqual(run(path.join(tmp, "contents/tech/2024-01-01/good.mdx")).lines.slice(0, -1), [
      'contents/tech/2024-01-01/good.mdx: [error] slug "good" 이 중복됨 (contents/log/2024-01-03/good.mdx)',
      "contents/tech/2024-01-01/good.mdx: [warn] description 이 다른 글과 같음 (contents/tech/2024-01-04/Bad_Slug.mdx)",
    ]);
    const outside = run(path.join(tmp, "README.md"));
    assert.equal(outside.status, 0);
    assert.equal(outside.lines.join(""), "");
  });

  test("알 수 없는 옵션은 exit 2", () => {
    assert.equal(run("--strcit").status, 2);
  });

  test("next.config.js 를 못 읽으면 지정 파일과 무관하게 error", () => {
    const root = mkdtempSync(path.join(tmp, "broken-"));
    mkdirSync(path.join(root, "contents/tech/2024-01-01"), { recursive: true });
    writeFileSync(path.join(root, "contents/tech/2024-01-01/x.mdx"), post({ body: "![설명](https://github.com/x.png)\n" }));
    writeFileSync(path.join(root, "next.config.js"), 'throw new Error("boom");\n');
    const r = spawnSync(process.execPath, [path.join(ROOT, "scripts/validate-content.mjs"), "--root", root, path.join(root, "contents/tech/2024-01-01/x.mdx")], { encoding: "utf8" });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /^next\.config\.js: \[error\] next\.config\.js 를 읽지 못함: boom$/m);
    assert.match(r.stdout, /x\.mdx: \[error\] 9행 이미지: https:\/\/github\.com 허용 여부를 확인하지 못함/);
  });
});
