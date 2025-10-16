export function toYYYYMMDD(date: Date, tz = "Asia/Seoul") {
  // en-CA 포맷은 'YYYY-MM-DD'를 보장
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export const toHHMMSS = (t: string) => {
  const [h = "00", m = "00", s = "00"] = (t || "").split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
};

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

export function formatTime(time: string) {
  // time = "08:00"
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);

  return date.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true, // 오전/오후 표기
  });
}
