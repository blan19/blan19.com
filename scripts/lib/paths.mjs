// scripts 공용 경로 도우미.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// node_modules/.bin 에 있으면 그 경로를, 없으면 PATH 에서 찾도록 이름 그대로 돌려준다.
export const resolveBin = (cmd) => {
  if (cmd.includes("/")) return cmd;
  const local = path.join(ROOT, "node_modules", ".bin", cmd);
  return existsSync(local) ? local : cmd;
};
