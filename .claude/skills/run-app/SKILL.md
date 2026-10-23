---
name: run-app
description: blan19.com 앱을 운영 DB 를 차단한 채 로컬에서 실행하고, 페이지를 열어 확인하거나 스크린샷을 찍은 뒤 서버를 종료한다. 글 미리보기, 프로덕션 빌드 확인도 포함한다.
when_to_use: 사용자가 "앱 실행해봐", "서버 띄워줘", "화면 확인해봐", "미리보기", "글 어떻게 보이는지 봐줘", "스크린샷", "run the app", "start the dev server", "launch", "preview", "take a screenshot", "check it in the browser" 같은 요청. 실제 앱에서 변경을 확인할 때 쓴다.
argument-hint: "[dev|preview|prod] [경로, 예: /tech/<slug>]"
---

# /run-app

`.env` 는 운영 DB 다. 서버는 이 스킬의 시작 명령으로만 띄운다(CLAUDE.md 의 운영 DB 안전 규칙).

## 모드 선택

| 모드 | 용도 | 시작 명령 |
|---|---|---|
| `preview` (권장) | 글 화면(`/tech/<slug>`) 확인. 조회수 칸은 비어 보임 | 아래 "글 미리보기" 명령 |
| `dev` | 코드 수정 중 HMR, DB 를 쓰지 않는 페이지(`/log`, RSS, sitemap, `/og`) 확인 | `node scripts/with-blocked-db.mjs next dev -p 3100` |
| `prod` | 프로덕션 빌드 동작 자동 점검 | `npm run verify` (DB 차단 빌드 + smoke, 서버를 알아서 띄우고 종료함) |

`dev` 는 `POSTGRES_URL` 까지 차단 주소로 덮는다(`npm run dev:safe` 와 같은 env). 그래서 조회수(글 머리, 목록 행)와 홈 "많이 읽힌 글"이 표시되지 않는다(쿼리가 실패하면 컴포넌트가 오류를 삼키고 그 칸만 비운다). 터미널의 `[views] 조회수를 불러오지 못했습니다 … P1001`, `[most-read] …` 로그와 함께 DB 가 막혀서 생기는 정상 현상이고 코드 버그가 아니다. 페이지 전체가 `error.tsx`("문제가 생겼습니다")로 바뀌면 그건 버그다.

### 글 미리보기 (`preview`)

`--preview` 는 `POSTGRES_URL` 만 빈 값으로 두고 나머지 URL 은 차단 주소로 덮는다. `getViewCount`, `getAllViewCounts` 가 DB 에 접속하지 않고 null 을 반환한다(글 머리 조회수는 `0회`, 목록 행 조회수 칸은 빈다).

```bash
node scripts/with-blocked-db.mjs --preview next dev -p 3100
```

- `/`, `/tech`, `/tech/<slug>`, `/log` 는 정상으로 보인다.
- 홈은 파일시스템으로 그려진다. "많이 읽힌 글"(`getBestBlogPosts`)만 `POSTGRES_URL` 검사 없이 쿼리하므로 `.next/cache` 에 이전 실행의 캐시가 남아 있을 때만 보이고, 없으면 섹션이 빠진다(정상, 로그에 `[most-read] … P1001`).
- 터미널의 `⨯ unhandledRejection … P1001 … DatabaseNotReachable`(increment)은 예상된 로그다.
- 프로덕션 빌드로 보려면 `node scripts/with-blocked-db.mjs next build` 뒤에 `node scripts/with-blocked-db.mjs --preview next start -p 3100` 을 실행한다(`npm run build` 는 DB 차단 없이 `.env` 를 읽으므로 쓰지 않는다).

## 절차

1. 준비: 포트가 비었는지 확인한다(`lsof -ti tcp:3100` 결과가 비어 있어야 함, 사용 중이면 다른 포트).
2. 시작: 시작 명령 뒤에 `> <scratchpad>/app.log 2>&1 & echo "PID=$!"` 를 붙여 일반 Bash 호출로 실행하고 PID 를 기록한다. `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3100/robots.txt` 가 200 이 될 때까지 기다린다.
3. 확인한다.
   - HTML/상태: `curl -s http://127.0.0.1:3100/<경로>`
   - 화면: Playwright MCP 로 `http://localhost:3100/<경로>` 를 연다(`browser_navigate` → `browser_snapshot`). `127.0.0.1` 로 열면 Next 가 HMR 웹소켓을 cross-origin 으로 막아 콘솔에 `/_next/hmr` 오류와 `allowedDevOrigins` 안내가 반복된다. 예상된 로그이며 `next.config.js` 를 바꾸지 않는다.
   - 스크린샷: `browser_take_screenshot` 의 filename 은 `.playwright-mcp/<이름>.png` 처럼 상대경로로 준다(Playwright MCP 는 저장소 루트와 `.playwright-mcp/` 밖에 저장하지 못함). 남길 파일은 scratchpad 로 옮긴다.
   - 다크모드: 시스템 다크는 `browser_emulate_media` 로 `prefers-color-scheme: dark`. 강제 테마는 헤더의 테마 버튼(시스템/라이트/다크)을 누르거나 `localStorage.theme` 를 `light`/`dark` 로 두고 새로고침한다. 모바일: `browser_resize`(예: 390x844). 레이아웃은 <768(한 열, 여백 16px), 768–1279(한 열, 여백 32px), ≥1280(왼쪽 레일 그리드: 섹션 라벨과 글 목차가 레일로) 세 구간으로 바뀐다.
   - 홈 히어로 매듭: 서버 SVG 가 먼저 보이고 첫 캔버스 프레임 뒤 `figure.hero-obj[data-ready]` 가 붙으며 캔버스로 바뀐다. 천천히 회전하므로 스크린샷마다 각도가 조금 다른 건 정상이고, 고정된 화면이 필요하면 `browser_emulate_media` 로 `reduced-motion: reduce` 를 준다(정지 프레임). 404 는 SVG 만 있고 캔버스가 없다.
   - next/image, 하이드레이션 경고는 `browser_console_messages` 로 본다.
4. 종료한다(필수): `kill <PID>` 를 실행한 뒤 `lsof -ti tcp:3100` 가 비었는지 확인한다. 남은 PID(`next-server` 하위 프로세스)가 있으면 그 PID 도 kill 한다. 1단계에서 포트가 비어 있었으므로 이 PID 들은 내가 띄운 것이다. Playwright 를 썼다면 `browser_close` 를 호출하고 `<저장소 루트>/.playwright-mcp/` 디렉터리를 통째로 지운다. Playwright MCP 는 navigate 할 때마다 메인 세션 작업 디렉터리(저장소 루트)의 `.playwright-mcp/` 에 로그를 쓰므로 스크린샷 파일만 지우면 로그가 남는다(gitignore 대상이지만 남기지 않는다).

## 보고

모드, 확인한 URL, 결과(정상 여부, 콘솔 오류, 스크린샷 경로), 서버 종료 여부를 적는다. 차단 env 때문에 생긴 DB 오류는 "예상된 동작"으로 따로 표시한다.
