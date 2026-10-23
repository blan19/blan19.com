// src/ 의 순수 .ts 모듈을 Node 24 type stripping 으로 import 한다(검사기가 렌더러와 같은 값/함수를 쓰도록).
// package.json 에 "type" 이 없어(next.config.js, postcss.config.js 가 CJS) Node 가 import 마다
// MODULE_TYPELESS_PACKAGE_JSON 경고를 stderr 로 내므로, import 하는 동안 그 경고만 걸러 낸다.
// 대상 모듈 조건: erasable TS 문법만(enum, namespace, parameter properties 금지),
// `@/` 별칭, 확장자 없는 상대 import, server-only import 금지.
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "./paths.mjs";

const IGNORED = "MODULE_TYPELESS_PACKAGE_JSON";

export const importTs = async (relPath) => {
  const original = process.emitWarning;
  process.emitWarning = function (warning, ...rest) {
    const code = typeof rest[0] === "object" ? rest[0]?.code : rest[1];
    if (code === IGNORED) return;
    return original.call(this, warning, ...rest);
  };
  try {
    return await import(pathToFileURL(path.join(ROOT, relPath)).href);
  } finally {
    process.emitWarning = original;
  }
};
