// 검사 함수가 돌려주는 문제 한 건: { level: "error" | "warn", message }. 경로는 scan 이 붙인다.
export const error = (message) => ({ level: "error", message });
export const warn = (message) => ({ level: "warn", message });
