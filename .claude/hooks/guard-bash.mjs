#!/usr/bin/env node
// PreToolUse(Bash) 훅: 운영 DB / 프로덕션 배포 / .env 를 건드리는 명령을 막는다.
// - 차단: exit 2 + stderr(이유와 안전한 대안) → Claude 에게 전달된다.
// - 확인: exit 0 + permissionDecision "ask" (스키마 변경이 있는 상태의 git push / gh pr create / vercel deploy,
//   명령 이름이 변수인 경우 → 사용자에게 묻는다. 권한 모드에 따라 확인 창이 뜨지 않을 수 있다).
// - 입력이 이상하거나 판정 중 내부 오류가 나면 조용히 exit 0 (fail open). 권한 deny 규칙이 2차 방어선이다.
//   판정 모듈(guard-bash/*.mjs)을 불러오지 못하면 모든 명령을 막는다(fail closed): 파일이 깨진 채로 전부 통과시키지 않는다.
// - 구성: guard-bash/lex.mjs(셸 토크나이저), guard-bash/rules.mjs(명령별 판정), 이 파일(stdin/exit code 계약).
// - 테스트: .claude/hooks/guard-bash.test.mjs (`npm run test:hooks`). 판정을 고치면 실행하고 케이스를 추가한다.
//
// 명령 문자열을 셸처럼 대략 토큰화해 && || ; | & 개행, $( ) / 백틱 / <( ), bash -c, eval, 파이프·<<< 로
// 셸에 넘긴 문자열 안쪽까지 "실제로 실행되는" 명령만 본다. 따옴표 안의 단순 언급(git commit -m "prisma db push")은 무시한다.
// 상대 경로는 같은 명령 안의 앞선 `cd <dir> &&` 를 반영하고, ~, $HOME, $PWD, $CLAUDE_PROJECT_DIR 는 펼친다.
// 우회를 완벽히 막지는 못한다. 행동 규칙(CLAUDE.md)이 우선이다. 알려진 한계(막지 않음):
//   명령 치환이나 모르는 변수로 만든 경로(`cat $(echo .env)`, `grep -r x $DIR`), 스크립트 파일 안의 명령(`bash x.sh`, `node x.mjs`, `make`),
//   셸 env 출력(`printenv`, `env | grep …`), 디렉터리 통째 복사·압축(`cp -r . /tmp/x`, `tar cf x.tar .`),
//   묶인 짧은 옵션에 붙은 경로(`curl -d@.env`), 읽기 도구 목록(READERS)에 없는 명령, find -exec 의 셸 래퍼(`-exec sh -c 'cat "$1"'`),
//   이전 Bash 호출이나 pushd 로 바뀐 작업 디렉터리(훅은 프로젝트 루트에서 실행된다고 본다).
import { readFileSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

const main = async () => {
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return 0;
  }
  const command = input?.tool_input?.command;
  if (typeof command !== "string" || command.trim() === "") return 0;

  let analyze;
  try {
    ({ analyze } = await import("./guard-bash/rules.mjs"));
  } catch (error) {
    process.stderr.write(`[guard-bash] 판정 모듈(.claude/hooks/guard-bash/)을 불러오지 못해 모든 Bash 명령을 막습니다: ${error.message}\n  사용자에게 훅 파일 확인을 요청하세요.\n`);
    return 2;
  }

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

// import 했을 때는 실행하지 않는다. Node 는 진입 파일의 심볼릭 링크를 풀므로 argv[1] 도 실제 경로로 비교한다.
const isMain = () => {
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
};

if (isMain()) {
  let code = 0;
  try {
    code = await main();
  } catch {
    code = 0;
  }
  process.exit(code);
}
