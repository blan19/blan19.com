// date 는 "YYYY-MM-DD"(frontmatter publishedAt). 시간대와 무관한 달력 날짜로 다룬다.
const parts = (date: string) => {
  const [year, month, day] = date.slice(0, 10).split("-");
  return { year, month, day };
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// "2024-03-26" → "2024.03.26"
export const formatDotDate = (date: string) => {
  const { year, month, day } = parts(date);
  return `${year}.${month}.${day}`;
};

// "2024-03-26" → "03.26"
export const formatMonthDay = (date: string) => {
  const { month, day } = parts(date);
  return `${month}.${day}`;
};

// "2024-03-26" → "화요일"
export const koreanWeekday = (date: string) => {
  const { year, month, day } = parts(date);
  const dow = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  ).getUTCDay();
  return `${WEEKDAYS[dow]}요일`;
};

// "2024-03-26" → "2024.03"
export const formatYearMonth = (date: string) => {
  const { year, month } = parts(date);
  return `${year}.${month}`;
};
