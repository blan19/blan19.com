# G3 "Minimal Index" 디자인 명세

사이트 디자인의 원본이다. 값의 실제 정의는 `src/styles/globals.css`(토큰, 공용 클래스, 크롬), `markdown.css`(글), `pages.css`(홈, 목록, 기록, 404, 히어로)이고, 이 문서와 CSS 가 다르면 CSS 가 맞다(고칠 때 이 문서도 같이 고친다). 왜 이런 디자인인지는 [intent.md](intent.md) 2장, CSS 작성 규칙(레이어, 셀렉터 범위, 금지 클래스 이름, Tailwind 매핑)은 `.claude/rules/frontend.md` 가 원본이다.

## 1. 원칙

- 회색조만 쓴다. 강조는 잉크 대비, 굵기, 밑줄로 한다.
- 예외 색은 둘이다: 빨강(`--danger`, `--danger-text`)은 오류 표시(404, error 코드 라벨)에만, slate(`--slate-l`/`--slate-d`)는 코드의 문자열과 숫자 리터럴에만.
- 글꼴은 Pretendard 와 IBM Plex Mono 둘. 세리프, 한글 이탤릭, 형광펜, 도장, 배지는 없다.
- 장식 오브젝트는 홈과 404 의 점묘 노트북 하나다.

## 2. 토큰

### 2.1 팔레트 (테마 무관, `:root`)

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--gray-0` | `#f8f9fa` | 라이트 배경 |
| `--gray-1` | `#f1f3f5` | 라이트 subtle/코드 배경, 다크 본문 글자 |
| `--gray-2` | `#e9ecef` | 라이트 헤어라인 |
| `--gray-3` | `#dee2e6` | 라이트 강한 선, 선택 영역 |
| `--gray-4` | `#ced4da` | 다크 보조 글자 |
| `--gray-5` | `#adb5bd` | 라이트 장식 글자, 신택스 gutter |
| `--gray-6` | `#868e96` | (예비) |
| `--gray-7` | `#495057` | 라이트 보조 글자 |
| `--gray-8` | `#343a40` | 다크 강한 선 |
| `--gray-9` | `#212529` | 라이트 본문 글자, 다크 subtle/코드 배경 |
| `--gray-6a` | `#666e76` | 라이트 메타(gray-0 위 4.91:1) |
| `--gray-6b` | `#5f666e` | 라이트 코드 주석·구두점(gray-1 위 5.23:1) |
| `--gray-8a` | `#5c636a` | 다크 줄 번호(장식) |
| `--gray-9a` | `#8d949b` | 다크 메타(gray-10 위 5.80:1) |
| `--gray-9b` | `#2b3035` | 다크 헤어라인 |
| `--gray-9c` | `#969da4` | 다크 코드 주석(gray-9 위 5.62:1) |
| `--gray-10` | `#16181b` | 다크 배경 |
| `--gray-11` | `#0b0c0e` | 잉크 |
| `--slate-l` / `--slate-d` | `#3d5a75` / `#9fb4c7` | 신택스 리터럴 |
| `--red-4` `--red-5` `--red-7` `--red-8` | `#ff8787` `#ff6b6b` `#e03131` `#c92a2a` | 오류 |

### 2.2 의미 토큰

라이트는 `:root`, 다크는 `:root` 안의 `@variant dark` 한 곳에 둔다(시스템 다크 + 강제 다크로 펼쳐진다). 다른 토큰을 참조하는 별칭과 `color-mix` 파생은 라이트에 한 번만 둔다. 대비는 각 테마 배경 기준이다.

| 토큰 | 라이트 | 다크 | 쓰임 |
|---|---|---|---|
| `--bg` | gray-0 | gray-10 | 페이지 |
| `--bg-subtle` | gray-1 | gray-9 | 콜아웃, 인라인 코드, 스켈레톤, 메뉴 hover |
| `--code-bg` | gray-1 | gray-9 | 코드 블록(다크는 페이지보다 한 단계 밝아 블록이 보인다) |
| `--line` | gray-2 | gray-9b | 헤어라인, 행 구분선, 코드 테두리 |
| `--line-strong` | gray-3 | gray-8 | 인용 선, 쉬는 밑줄, 메뉴 테두리 |
| `--selection` | gray-3 | gray-8 | `::selection`, `mark` |
| `--text` | gray-9 (14.63:1) | gray-1 (15.99:1) | 제목, 본문 |
| `--text-2` | gray-7 (7.76:1) | gray-4 (11.90:1) | lede, 인용, 콜아웃 본문, 보조 |
| `--text-3` | gray-6a (4.91:1) | gray-9a (5.80:1) | 메타, 날짜, 라벨, 쉬는 내비 |
| `--text-4` | gray-5 | gray-7 | 장식 전용(구분 기호, 태그 개수). 정보의 유일한 수단으로 쓰지 않는다 |
| `--ink` | gray-11 | `#ffffff` | hover 강조 |
| `--focus` | gray-9 | gray-1 | `:focus-visible` 테두리 |
| `--danger` | red-7 | red-5 | 오류 테두리/아이콘 |
| `--danger-text` | red-8 (5.18:1) | red-4 (7.68:1) | `404`, `error` 코드 라벨 |
| `--img-filter` | `none` | `brightness(0.88)` | 글 이미지(hover/focus 때 없앰) |
| `--shadow` | `0 8px 24px rgb(0 0 0 / 0.08)` | `… / 0.45` | 테마 메뉴, 목차 pill/sheet |
| `--scrim` | `rgb(11 12 14 / 0.5)` | `rgb(0 0 0 / 0.6)` | 목차 sheet 배경막 |
| `--scrim-strong` | `rgb(11 12 14 / 0.82)` | 같음 | 이미지 확대 배경막 |
| `--object` | gray-9 | gray-3 | 히어로 노트북 색 |
| `--object-alpha` | `0.78` | `0.70` | 히어로 점의 최대 불투명도(제목보다 약하게) |
| `--diff-add` / `--diff-del` | `--text` / `--text-3` | 같음(별칭) | ```` ```diff ```` 의 +/− 줄 |
| `--diff-del-hl` | `--text-3` | `--text-2` | 강조 줄 안의 삭제 글자(다크 강조 줄 위 `--text-3` 는 4.46:1 이라 올림) |
| `--line-hl-bg` | `color-mix(in srgb, var(--ink) 4%, var(--code-bg))` | 파생 | 강조 줄, 추가 줄 배경 |

`color-scheme` 은 라이트 `light`, 다크 `dark`. 브라우저 테마 색(`THEME_COLORS`, `<meta name="theme-color">`)은 `--bg` 와 같은 `#F8F9FA`/`#16181B` 다.

### 2.3 신택스 토큰 (`--sh-*`)

코드 배경과 강조 줄 배경 모두에서 4.5:1 이상이다(`--sh-gutter` 만 장식). 신택스에는 굵게와 이탤릭을 쓰지 않는다.

| 토큰 | 라이트 | gray-1 위 / 강조 줄 위 | 다크 | gray-9 위 / 강조 줄 위 |
|---|---|---|---|---|
| `--sh-keyword` | gray-11 | 17.59 / 16.22 | `#ffffff` | 15.43 / 13.68 |
| `--sh-fn`, `--sh-type` | gray-9 | 13.87 / 12.79 | gray-1 | 13.87 / 12.30 |
| `--sh-text`, `--sh-prop` | gray-7 | 7.35 / 6.78 | gray-4 | 10.32 / 9.15 |
| `--sh-punct` | gray-6b | 5.23 / 4.82 | gray-5 | 7.43 / 6.59 |
| `--sh-comment` | gray-6b | 5.23 / 4.82 | gray-9c | 5.62 / 4.99 |
| `--sh-string`, `--sh-number` | slate-l | 6.47 / 5.97 | slate-d | 7.22 / 6.40 |
| `--sh-gutter` | gray-5 | 장식 | gray-8a | 장식 |

### 2.4 글꼴, 크기, 굵기

```
--sans: var(--font-pretendard), Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif;
--mono: var(--font-plex-mono), var(--font-pretendard), ui-monospace, SFMono-Regular, Menlo, monospace;
```

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--fs-display` | 30px (<768 26px) | 페이지 h1, 글 h1 |
| `--fs-title` | 21px | 홈 소개 h1(≥768), 글 h2, 기록 h2 |
| `--fs-body` | 17px | 글과 기록 본문, 글 lede, 글 h3, 홈 소개 h1(<768), 워드마크 |
| `--fs-ui` | 15px | body 기본, 목록 제목, 내비, 링크, 콜아웃, 각주, 참고 자료, 표 |
| `--fs-meta` | 13px | 레일 라벨, 날짜, 목차, 목록 설명, 개수, 코드 머리 |
| `--fs-code` | 13.5px | 코드 블록만 |

- 굵기: `--fw-regular` 400, `--fw-medium` 500, `--fw-semi` 600, `--fw-bold` 650. 600 은 목록 제목(홈, /tech, 많이 읽힌 글, 최근 기록)과 `em` 에만 쓴다. `strong` 과 제목은 650.
- Pretendard: 제목, 본문, 인용, UI. Plex Mono(400/500): 날짜, 읽는 시간, 조회수, 순위, 태그 필터, 글 메타 줄, 코드, 각주 번호.
- body: `400 15px/1.65`, `word-break: keep-all`, `overflow-wrap: anywhere`, `font-feature-settings: "ss06"`. 제목은 `text-wrap: balance`, 문단은 `pretty`.
- `em` 은 이탤릭 없이 600. `mark` 와 `::selection` 은 `--selection` 회색 배경.

### 2.5 레이아웃 토큰

| 토큰 | 값 |
|---|---|
| `--rail` | 176px |
| `--col-gap` | 56px |
| `--main` | 688px |
| `--gutter` | 16px (≥768 32px) |
| `--obj-w` | 324px (768–1023 252px, <768 `min(100%, 312px)`) |
| `--radius` / `--radius-sm` | 6px / 4px |
| `--underline-offset` | 4px |
| `--ease` | `cubic-bezier(0.2, 0.7, 0.2, 1)` |

## 3. 레일 그리드와 브레이크포인트

브레이크포인트는 768px 와 1280px 이다(1024px 는 히어로 상자 너비에만 쓴다). 구조는 `.site-wrap` > `.rail-grid` > `.rail-side`(레일) / `.rail-main`(본문 열).

| | <768 | 768–1279 | ≥1280 |
|---|---|---|---|
| 컨테이너(`.site-wrap`) | 화면 − 2×16px | 최대 688 + 2×32px, 가운데 | 최대 920(176 + 56 + 688) + 2×32px, 가운데 |
| 열 | 1 | 1 | 레일 176 · 간격 56 · 본문 688 |
| 섹션 라벨(`.rail-label`, 13px/500 `--text-3`) | 내용 위, 아래 8px | 같음 | 레일, 위 6px |
| 헤더(위 36px) | 워드마크 왼쪽, 내비 오른쪽 | 같음 | 워드마크는 레일, 내비는 본문 열 오른쪽 끝 |
| 푸터(위 120px, 아래 48px) | 본문 열, 위 헤어라인 | 같음 | 본문 열 안 |
| 페이지 머리(`.page-head`) 위 여백 | 48px | 88px | 88px |
| 홈 소개 위 여백 | 40px | 72px | 72px |
| 홈 소개 | 글 → 링크 → 오브젝트(위 24px, 왼쪽 정렬) | `[글 1fr | --obj-w]`, 간격 40, 세로 가운데 | 같음(본문 열 안) |
| 홈 섹션 간격 | 52px | 64px | 64px |
| 색인 행 | 1행 제목, 2행 날짜 + 읽는 시간·조회수 | 날짜 96 · 제목(+설명) · 읽는 시간, 간격 20 | 같음 |
| 글 머리 | 위 48, 아래 40 | 위 88, 아래 56 | 같음 |
| 글 목차 | 접힌 `details` + 떠 있는 pill/sheet | 접힌 `details` | 레일의 sticky 목차(위 32px), `details` 숨김 |

## 4. 컴포넌트

### 4.1 크롬과 공용

- 워드마크: `blan19` 텍스트만(17px/650, −0.02em). 도장 없음.
- 내비 링크(`.nav-link`): 15px `--text-3`, 누르는 높이 44px. hover 와 현재 페이지는 `--text`, 현재 페이지만 1px 밑줄(offset 6px).
- 아이콘 버튼(`.icon-btn`): 40×40(<768 44×44), `--text-3` → hover `--text`. 배경 없음.
- 테마 메뉴: `--bg` 배경, `--line-strong` 테두리, 반경 8px, `--shadow`. 항목 13px `--text-2`, hover `--bg-subtle`, 선택 항목은 `--text` + 체크 아이콘. 선택지는 시스템/라이트/다크.
- 밑줄 링크(`.u-link`): 1px 밑줄 `--line-strong`(offset 4px) → hover 때 `currentColor` 와 `--ink`. 외부 링크는 `↗`(`.ext`).
- 페이지 h1(`.page-h1`) 30px/650/1.3, −0.025em. lede 15px/1.7 `--text-2`, 최대 40em.
- 오류 코드 라벨(`.code-label`): mono 13px/500 `--danger-text`.
- 푸터: 13px `--text-3`, `© 2023–<빌드한 해> blan19` 와 GitHub · 메일 · RSS.
- 아이콘: 24px viewBox, stroke 1.5, round 끝, 17px. 이름은 note, tip, important, warning, caution, copy, check, sun, moon, system, chev, file, term, img-off, list, x(`ui/icon`).

### 4.2 홈, 목록, 기록, 404

- 홈 소개 h1: <768 17px, ≥768 21px, 650, 1.55, 최대 15em(≥768, `text-wrap: pretty`, 데스크톱 약 3줄). 링크 줄(GitHub, 메일)은 15px `--text-2`.
- 색인 목록(`.idx-list`): 위 헤어라인, 행마다 아래 `--line`, 행 위아래 11px. 앞 칸(날짜) 96px, 순위 목록은 24px(<768 20px). 날짜·읽는 시간·순위는 mono 13px `--text-3` tabular. 제목 15px/600/1.55 `--text`, hover `--ink` + 1px 밑줄. 설명 13px `--text-3`(홈은 데스크톱에서 한 줄 말줄임, <768 숨김). 홈 행에는 태그와 조회수가 없다. /tech 행은 읽는 시간 아래 조회수(<768 은 옆).
- 많이 읽힌 글: 순위 + 제목 + 조회수 3행. 로딩 중에는 같은 높이(46px)의 막대 3줄. DB 가 실패하면 섹션째 없다.
- 최근 기록 줄(`.log-line`): 색인 행과 같은 열, 날짜 + 제목 + 첫 문단 한 줄 발췌.
- 태그 필터(/tech): mono 13px `--text-3` 한 줄, 간격 6/16px. 현재 태그는 `--text` + 1px 밑줄(offset 5px), 개수(`.n`)는 `--text-4`(현재/hover 때 `--text-3`). 정적 셸에서는 선택 표시가 없다.
- /tech 연도 묶음: 연도가 레일 라벨, 묶음 사이 64px. 목록 위 52px(≥768 64px).
- 기록(/log): 항목 사이 64px, 날짜는 레일 라벨(mono), 제목 21px/650/1.45, 본문 17px/1.85 `--text`(줄바꿈 유지, 문단 사이 1em), 태그 mono 13px `--text-3`.
- 404: 코드 라벨 `404`, h1, lede, 링크 줄(홈으로, 글 목록). ≥768 은 `[글 | --obj-w]` 간격 32 세로 가운데, <768 은 한 열(행 간격 32). 흩어진 노트북 정지 화면.
- 빈 상태(`.empty-note`): 15px `--text-3`, 위아래 24px.

### 4.3 글

- 글 머리: 메타 줄(mono 13px `--text-3`: 날짜 · 읽는 시간 · 조회수 · `#태그` 링크, 간격 4/14px), h1 30px/650/1.35(위 14px), lede 17px/1.7 `--text-2`(위 12px). 조회수 로딩 자리는 `— 회`(`--text-4`).
- 본문: 17px/1.85 `--text`. 블록 사이 1.15em, figure·콜아웃·표 위아래 1.6em, h2 위 2.6em. h2 21px/650/1.45, h3 17px/650/1.6, h4 15px/650, h5 15px/500 `--text-2`. 제목 hover 때 `#` 앵커(`--text-4`).
- 링크: `--line-strong` 1px 밑줄 → hover `currentColor`. 외부 링크 `↗`.
- 인라인 코드: mono 0.88em, `--bg-subtle`, 반경 4px.
- 인용: 왼쪽 2px `--line-strong`, 왼쪽 18px, `--text-2`, sans.
- 콜아웃: `--bg-subtle`, 반경 6px, 15px/1.75 `--text-2`, 머리(아이콘 + 라벨) 13px. 종류는 굵기와 왼쪽 선으로만 구분한다(빨강 없음).

  | 종류 | 라벨 | 라벨 굵기 | 왼쪽 2px 선 |
  |---|---|---|---|
  | note | 참고 | 500 | 없음 |
  | tip | 팁 | 500 | 없음 |
  | important | 중요 | 650 | `--line-strong` |
  | warning | 주의 | 650 | `--text-3` |
  | caution | 경고 | 650 | `--text` |

- 코드 블록: `--code-bg`, 1px `--line` 테두리, 반경 6px. 머리는 mono 13px `--text-3`(파일명 또는 언어, bash 는 "터미널")와 복사 버튼(텍스트 "복사"/"복사됨"). 본문 mono 13.5px/1.75. 줄 번호·`$`·+/− 기호는 `--sh-gutter` 의 생성 콘텐츠(복사되지 않음). 강조 줄은 `--line-hl-bg` + 왼쪽 2px `--text-3`. 추가 줄은 `--line-hl-bg` 배경, 삭제 줄은 취소선. 30줄을 넘으면 JS 가 있을 때 16줄 높이로 접고 아래를 흐리게 덮은 뒤 "전체 보기" 버튼을 둔다. 긴 줄은 블록 안에서 가로 스크롤한다.
- 다이어그램(mermaid): `--line` 테두리, 반경 6px, `--bg` 배경. 색은 CSS 토큰에서 만든 회색조 테마.
- 이미지: `--line` 테두리, 반경 6px, 다크에서 `--img-filter`. 캡션 13px `--text-3`. 누르면 확대 dialog(배경막 `--scrim-strong`). 로드 실패 시 `--bg-subtle` 대체 상자.
- 표: 15px, `th` 13px/500 `--text-3`, 넓으면 가로 스크롤.
- 각주: 본문 참조는 mono `[n]`, 글 끝 "각주" 섹션 하나가 유일한 각주 UI 다(사이드노트 없음).
- 목차: 13px `--text-3`, 레일 목록은 왼쪽 1px `--line` 선. 현재 섹션만 `--text`(레일은 왼쪽 선도 `--text`). 진행률이나 퍼센트는 없다. <768 의 pill 은 화면 아래 가운데에 떠 있고(`--bg`, `--line-strong` 테두리, `--shadow`) 누르면 아래에서 sheet 가 열린다.
- 글 끝(위 72px, 섹션 사이 48px): 섹션 라벨(13px/500 `--text-3`), 참고 자료(헤어라인 행, 호스트 `--text` + 경로 `--text-3`), 이전/다음 글, 댓글(utterances iframe, 로드 전 점선 스켈레톤).

## 5. 히어로 오브젝트 (점묘 노트북)

구현 규칙(서버 SVG 와 캔버스의 동기화, 캔버스 수명주기)은 `.claude/rules/frontend.md` 의 히어로 절이 원본이다. 여기는 보이는 모양만 적는다.

- 홈: 소개 글 옆의 MacBook 비율 노트북, 화면에 재생 글리프와 재생 막대. 404: 같은 노트북의 흩어진 분해도 정지 화면. 같은 (모드, 시드)는 언제나 같은 모양이다.
- 상자: 너비 `--obj-w`, `aspect-ratio: 3 / 2`, viewBox 360×240. 색 `--object`, 최대 불투명도 `--object-alpha`. 점은 불투명도 12칸으로 묶어 그린다.
- 밝기 위계: 화면 안에서는 재생 글리프(테두리 1.0, 채움 0.85)와 재생 막대의 지난 구간, 헤드만 밝다. 하판 윗면 모서리와 덮개 테두리 0.95, 트랙패드 0.7, 카메라 점 0.6, 자판 0.55, 바닥 모서리 0.4, 화면 점 격자 0.30–0.45. 0.04 이하인 점은 그리지 않는다.
- 정렬: 잉크(상자 안 빈 폭 제외)가 ≥768 에서는 본문 열 오른쪽 끝, <768 에서는 글 왼쪽 끝에 맞는다. 가로 스크롤을 만들지 않는다.
- 첫 모습: 서버 SVG, 캔버스 첫 프레임, reduced motion 정지 프레임이 모두 같은 자세(yaw −0.42, 재생 진행률 0.38)라 SVG → 캔버스 교차 때 튀지 않는다. JS 가 없으면 SVG 가 최종 이미지다.
- 움직임(홈만): 46초 주기로 ±0.16rad 천천히 좌우로 흔들고, 재생 막대는 72초에 한 바퀴(다시 시작할 때 지난 구간을 1.2초 동안 흐린다). 정밀 포인터에서만 시차(yaw ±0.07, pitch ±0.05)와 드래그 회전(yaw ±0.35, pitch ±0.12). 30fps 상한, 화면 밖이나 탭이 숨으면 멈추고, 입력 없이 40초가 지나면 마지막 프레임에서 멈춘다.
- 쓰지 않는 곳: 헤더, 푸터, OG 이미지, 파비콘(파비콘은 이전 히어로였던 점묘 매듭 정적 SVG 다).

## 6. OG 이미지

- 1200×630 PNG, `#F8F9FA` 배경, 모두 Pretendard Bold. 위 `blan19`(40px `#212529`), 가운데 제목(65px/85px, 최대 3줄, 70자 넘으면 말줄임, 단어 단위 줄바꿈), 아래 2px `#DEE2E6` 선과 `www.blan19.xyz`(23px `#666E76`), 글 카드는 오른쪽에 `tech`(`#212529`).
- 오브젝트, 도장, 그 밖의 색은 없다.

## 7. 접근성

- 대비: 정보를 담는 글자는 모두 4.5:1 이상이다(2.2, 2.3 표). `--text-4` 와 `--sh-gutter` 는 장식 전용이라 그것만으로 정보를 전하지 않는다(태그 개수는 링크 이름에 함께 들어간다).
- 초점: `:focus-visible` 은 2px `--focus` 테두리, offset 3px. 건너뛰기 링크("본문으로 건너뛰기")가 `<main id="main" tabIndex={-1}>` 로 가고, main 자체에는 테두리를 그리지 않는다.
- 누르는 영역: 내비 링크 높이 44px, 아이콘 버튼 40px(<768 44px).
- 장식: 히어로 `figure` 는 `aria-hidden`, 제목 끝 `#` 앵커는 `aria-hidden` + `tabIndex -1`(키보드와 스크린리더는 목차 링크로 간다). 코드의 줄 번호와 기호는 생성 콘텐츠라 읽히지도 복사되지도 않는다.
- 랜드마크와 이름: 목차는 `nav[aria-label="목차"]`, 표 스크롤 영역은 `role=region`, 로딩 자리는 `aria-busy`, 페이지 언어 `lang="ko"`.
- 움직임: `prefers-reduced-motion` 이면 전역 전환과 애니메이션을 0.01ms 로 줄이고, 히어로는 정지 프레임 하나만 그린다. 터치에서는 히어로가 스크롤을 잡지 않는다(`touch-action: pan-y pinch-zoom`).
- 색 외 단서: 콜아웃은 아이콘 + 라벨 + 굵기 + 선, diff 줄은 기호 + 배경/취소선, 현재 내비·태그는 밑줄로도 구분한다.
- UI 문구는 한국어다.
