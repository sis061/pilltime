export const toYYYYMMDD = (d: Date) => d.toISOString().slice(0, 10);

export function sevenDayWindow(tz = "Asia/Seoul") {
  // 서버 TZ와 무관하게, 해당 tz의 '오늘' 기준 7일 윈도우
  const now = new Date();
  const today = new Date(
    Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now)
  ); // YYYY-MM-DD in tz
  const to = new Date(today);
  to.setDate(to.getDate() + 7);
  return { fromStr: toYYYYMMDD(today), toStr: toYYYYMMDD(to) };
}
