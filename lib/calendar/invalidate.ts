// lib/calendar/invalidate.ts
import "server-only";
import { revalidateMonthIndicator } from "./indicator";

/** 여러 YYYY-MM-DD를 받아 해당 월만 중복 없이 무효화 */
export async function invalidateMonthsByDates(userId: string, dates: string[]) {
  const uniqYm = new Set(
    dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).map((d) => d.slice(0, 7))
  );
  for (const ym of uniqYm) {
    // ym-01 같은 임의 날짜로 호출 (monthTag 내부에서 YYYY-MM만 사용)
    await revalidateMonthIndicator(userId, `${ym}-01`);
  }
}
