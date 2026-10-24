// guard-bash 의 셸 토크나이저. 명령 문자열을 셸처럼 대략 토큰화한다(판정은 rules.mjs).
// && || ; | & 개행, ( ), $( ) / 백틱 / <( ), heredoc, <<< 를 나눈다. 따옴표 안의 글자는 단어 값에만 남는다.
export const MAX_DEPTH = 6;

// 결과: segments = [{ words: [{ value, quoted }], redirs: [{ op, target }], heredocs: [body], pipedFrom?: segment,
//   op: 세그먼트를 끝낸 연산자("&&", "||", ";", "|", "&", "\n", "(", ")" 또는 끝이면 undefined),
//   prevOp: 세그먼트 앞의 연산자(처음이면 undefined). 빈 세그먼트를 건너뛰어 `(a) || b` 의 b 는 "||" 다. "(" 는 세지 않는다,
//   grouped: ( ) 서브셸이나 $( ) / 백틱 / <( ) 안쪽이면 true (cd 가 바깥 명령의 작업 디렉터리를 바꾸지 않는다),
//   nested: $( ) / 백틱 / <( ) 안쪽이면 true (바깥 && || ; 목록의 일부가 아니다) }]
export const lex = (src, depth = 0) => {
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
    let prevOp;

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
    const endSeg = (op) => {
      endWord();
      if (seg.words.length || seg.redirs.length) {
        seg.op = op;
        seg.prevOp = prevOp;
        seg.grouped = stopAtParen || parenDepth > 0;
        seg.nested = stopAtParen;
        segments.push(seg);
        lastSeg = seg;
      }
      if (op !== "(") prevOp = op;
      seg = { words: [], redirs: [], heredocs: [] };
    };
    const append = (s) => {
      word = (word ?? "") + s;
    };
    const nested = (inner) => {
      for (const s of lex(inner, depth + 1)) {
        s.grouped = true;
        s.nested = true;
        segments.push(s);
      }
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
        endSeg("\n");
        i++;
        skipHeredocs();
        continue;
      }
      if (c === "(") {
        endSeg("(");
        parenDepth++;
        i++;
        continue;
      }
      if (c === ")") {
        endSeg(")");
        if (parenDepth === 0 && stopAtParen) return i + 1;
        parenDepth = Math.max(0, parenDepth - 1);
        i++;
        continue;
      }
      if (c === ";" || c === "|" || (c === "&" && next !== ">")) {
        const op = (c === "|" && (next === "|" || next === "&")) || (c === "&" && next === "&") || (c === ";" && next === ";") ? c + next : c;
        endSeg(op);
        // 파이프(| 또는 |&)면 다음 세그먼트에 앞 세그먼트를 연결한다(echo … | bash, ls .env* | xargs cat 판정용).
        if (c === "|" && next !== "|") seg.pipedFrom = lastSeg;
        i += op.length;
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
