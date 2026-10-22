const DAY_MS = 24 * 60 * 60 * 1000;

// date 는 "YYYY-MM-DD"(frontmatter publishedAt). 시간대와 무관한 달력 날짜로 다루고,
// 오늘은 서버 로컬 날짜(Vercel 은 UTC)로 본다. 경과 기간은 꽉 찬 연/월/일 수다.
const formatDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();

  const monthsAgo =
    (currentYear - year) * 12 +
    (currentMonth - month) -
    (currentDay < day ? 1 : 0);
  const yearsAgo = Math.floor(monthsAgo / 12);
  const daysAgo = Math.round(
    (Date.UTC(currentYear, currentMonth - 1, currentDay) -
      Date.UTC(year, month - 1, day)) /
      DAY_MS
  );

  let formattedDate = "";

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo}y ago`;
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo}mo ago`;
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`;
  } else {
    formattedDate = "Today";
  }

  const fullDate = new Date(Date.UTC(year, month - 1, day)).toLocaleString(
    "en-us",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }
  );

  return `${fullDate} (${formattedDate})`;
};

export default formatDate;
