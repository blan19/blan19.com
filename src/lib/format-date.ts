// date 는 "YYYY-MM-DD"(frontmatter publishedAt). 시간대와 무관한 달력 날짜로 다룬다.
const parts = (date: string) => {
  const [year, month, day] = date.slice(0, 10).split("-");
  return { year, month, day };
};

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
