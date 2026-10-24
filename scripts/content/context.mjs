// 검사에 필요한 외부 값(경로, next.config.js 의 remotePatterns, 렌더러의 코드 언어 목록)을 한 번 읽는다.
// 읽기 실패는 조용히 넘기지 않고 setupProblems 로 돌려준다(CLI 가 대상 파일 필터와 무관하게 error 로 보고).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { importTs } from "../lib/import-ts.mjs";
import { ROOT as REPO_ROOT } from "../lib/paths.mjs";

export const LANGUAGES_MODULE = "src/lib/markdown/languages.ts";

// 심볼릭 링크(/tmp → /private/tmp 등)가 섞여도 경로 비교가 맞도록 실제 경로로 맞춘다.
export const real = (p) => {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.join(real(path.dirname(p)), path.basename(p));
  }
};

const loadRemotePatterns = (configPath) => {
  try {
    const config = createRequire(import.meta.url)(configPath);
    const patterns = config?.images?.remotePatterns ?? [];
    if (!Array.isArray(patterns)) return { patterns: [], error: "images.remotePatterns 가 배열이 아님" };
    return { patterns, error: null };
  } catch (e) {
    return { patterns: [], error: e.message.split("\n")[0] };
  }
};

const loadLanguages = async () => {
  try {
    const langs = await importTs(LANGUAGES_MODULE);
    if (typeof langs.normalizeLanguage !== "function" || !Array.isArray(langs.PLAIN_LANGUAGES)) {
      return { langs: null, error: "normalizeLanguage, PLAIN_LANGUAGES export 가 없음" };
    }
    return { langs, error: null };
  } catch (e) {
    return { langs: null, error: e.message.split("\n")[0] };
  }
};

// root: 검사할 저장소 루트(--root). public/ 과 next.config.js 는 root 에 없으면 repo 것을 쓴다.
export const loadContext = async (rootArg = REPO_ROOT) => {
  const root = real(rootArg);
  const pick = (name) => (fs.existsSync(path.join(root, name)) ? path.join(root, name) : path.join(REPO_ROOT, name));
  const configPath = pick("next.config.js");
  const remote = loadRemotePatterns(configPath);
  const languages = await loadLanguages();

  const setupProblems = [];
  if (remote.error) {
    setupProblems.push({ file: configPath, level: "error", message: `next.config.js 를 읽지 못함: ${remote.error}` });
  }
  if (languages.error) {
    setupProblems.push({ file: path.join(REPO_ROOT, LANGUAGES_MODULE), level: "error", message: `${LANGUAGES_MODULE} 에서 코드 언어 목록을 읽지 못함 (${languages.error})` });
  }

  return {
    root,
    contentsDir: path.join(root, "contents"),
    publicDir: pick("public"),
    remotePatterns: remote.patterns,
    remoteError: remote.error,
    langs: languages.langs,
    setupProblems,
  };
};
