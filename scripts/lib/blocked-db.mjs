// 운영 DB 차단 주소의 단일 원본. with-blocked-db.mjs, verify.mjs, smoke.mjs, guard-bash.test.mjs 가 import 한다.
// .env 의 POSTGRES_* 값보다 process env 가 우선하므로(Next.js, dotenv 모두)
// 이 값으로 덮어쓰면 어떤 DB 쿼리도 127.0.0.1:1 에서 즉시 실패한다.
// ci.yml 의 env 블록은 YAML 이라 import 할 수 없어 같은 값을 따로 적는다.
export const BLOCKED_DB_URL = "postgres://blocked:blocked@127.0.0.1:1/blocked";
export const BLOCKED_DB_HOST = new URL(BLOCKED_DB_URL).host; // "127.0.0.1:1"

export const blockedEnv = (base = process.env) => ({
  ...base,
  POSTGRES_URL: BLOCKED_DB_URL,
  POSTGRES_PRISMA_URL: BLOCKED_DB_URL,
  POSTGRES_URL_NON_POOLING: BLOCKED_DB_URL,
  POSTGRES_URL_NO_SSL: BLOCKED_DB_URL,
  DATABASE_URL: BLOCKED_DB_URL,
  POSTGRES_HOST: new URL(BLOCKED_DB_URL).hostname,
  POSTGRES_USER: "blocked",
  POSTGRES_PASSWORD: "blocked",
  POSTGRES_DATABASE: "blocked",
  BLAN19_BLOCKED_DB: "1",
});
