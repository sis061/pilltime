const TZ = "Asia/Seoul";

// export function sevenDayWindow(tz = "Asia/Seoul") {
//   // 서버 TZ와 무관하게, 해당 tz의 '오늘' 기준 7일 윈도우
//   const now = new Date();
//   const today = new Date(
//     Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now)
//   ); // YYYY-MM-DD in tz
//   const to = new Date(today);
//   to.setDate(to.getDate() + 7);
//   return { fromStr: toYYYYMMDD(today), toStr: toYYYYMMDD(to) };
// }

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

/** en-CA 포맷은 'YYYY-MM-DD'를 보장 */
export function toYYYYMMDD(date: Date, tz = TZ) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** "HH:mm" 혹은 "HH:mm:ss" 형태를 항상 "HH:MM:SS"로 반환 */
export const toHHMMSS = (t: string) => {
  const [h = "00", m = "00", s = "00"] = (t || "").split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
};

/** tz 기준 '오늘' 기준 7일 윈도우 */
export function sevenDayWindow(tz = TZ) {
  // tz 기준 오늘 자정 Date
  const now = new Date();
  const todayStr = toYYYYMMDD(now, tz);
  const today = dateFromYmdKST(todayStr);
  const to = addDays(today, 7);
  return { fromStr: toYYYYMMDD(today, tz), toStr: toYYYYMMDD(to, tz) };
}

/* ------------------ 내부에서만 쓰는 보조 함수 ------------------ */

/** YYYY-MM-DD 문자열 → KST 자정 Date */
export function dateFromYmdKST(ymd: string): Date {
  return new Date(`${ymd}T00:00:00+09:00`);
}

/** 현재 KST 기준 YYYY-MM-DD */
export function todayYmdKST(): string {
  return toYYYYMMDD(new Date(), TZ);
}

/** 월의 1일 (KST) Date */
export function startOfMonthKST(date: Date): Date {
  const ymd = toYYYYMMDD(date, TZ);
  const [y, m] = ymd.split("-").map(Number);
  return dateFromYmdKST(`${y}-${String(m).padStart(2, "0")}-01`);
}

/** Date 더하기 (KST 기준 단순 일수 덧셈) */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Date → YYYY-MM-DD (KST) */
export function ymdKST(date: Date): string {
  return toYYYYMMDD(date, TZ);
}
