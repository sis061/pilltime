import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type {
  MonthIndicatorMap,
  PillStatusServer,
  DayDot,
} from "@/types/calendar";

/* ------
 * CONST
 * ------ */

const ORDER: Record<PillStatusServer, number> = {
  missed: 4,
  skipped: 3,
  taken: 2,
  scheduled: 1,
};

/* ------
 * function
 * ------ */

/** YYYY-MM 파생 + 월 경계 */
function monthParts(centerYmd: string) {
  const [yy, mm] = centerYmd.split("-").map(Number);
  const ym = `${yy}-${String(mm).padStart(2, "0")}`;
  const startYmd = `${ym}-01`;
  const daysInMonth = new Date(yy, mm, 0).getDate();
  const endYmdInclusive = `${ym}-${String(daysInMonth).padStart(2, "0")}`;
  return { ym, startYmd, endYmdInclusive };
}

/** 오늘 KST YYYY-MM-DD */
function todayYMD_KST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isPillStatusServer(x: any): x is PillStatusServer {
  return (
    x === "scheduled" || x === "taken" || x === "missed" || x === "skipped"
  );
}

/** (날짜, 약) 그룹의 상태 집합을 최종 1개로 요약 */
function summarizeStatus(statuses: Set<PillStatusServer>): PillStatusServer {
  // 전부 taken인 경우에만 taken 인정
  if (statuses.size === 1 && statuses.has("taken")) return "taken";
  // 그 외엔 심각도 우선순위
  if (statuses.has("missed")) return "missed";
  if (statuses.has("skipped")) return "skipped";
  if (statuses.has("scheduled")) return "scheduled";
  // 방어적 디폴트 (이론상 도달 X)
  return "taken";
}

/** 내부 빌더(캐시 대상). 쿠키 접근 금지 → service client 사용 */
async function _buildMonthIndicatorMap(
  userId: string,
  centerYmd: string
): Promise<MonthIndicatorMap> {
  const { startYmd, endYmdInclusive } = monthParts(centerYmd);
  const supabase = createServiceSupabaseClient();

  const { data, error } = await supabase
    .from("intake_logs")
    .select(
      "date,status,medicine_id, medicines!left(name, deleted_at),medicine_schedules!left(id, deleted_at)"
    )
    .eq("user_id", userId)
    .gte("date", startYmd)
    .lte("date", endYmdInclusive);

  if (error) throw new Error(error.message);

  const today = todayYMD_KST();

  // byDateByMed: 날짜 → 약 → { label, statuses(Set) }
  const byDateByMed = new Map<
    string,
    Map<string, { label: string; statuses: Set<PillStatusServer> }>
  >();

  for (const row of data ?? []) {
    const ymd = row.date as string;
    const mid = String(row.medicine_id);
    const rawAny = row.status as unknown;
    if (!isPillStatusServer(rawAny)) continue;
    const raw = rawAny as PillStatusServer;

    // 과거 scheduled는 표시 제외 (백엔드에서 자동 missed 처리)
    if (raw === "scheduled" && ymd < today) continue;

    const name: string = (row as any).medicines?.name ?? "";
    const first = Array.from(name)[0] ?? "?";
    const label = /^[a-z]/i.test(first) ? first.toUpperCase() : first;

    let medMap = byDateByMed.get(ymd);
    if (!medMap) {
      medMap = new Map();
      byDateByMed.set(ymd, medMap);
    }

    const existing = medMap.get(mid);
    if (!existing) {
      medMap.set(mid, { label, statuses: new Set([raw]) });
    } else {
      existing.statuses.add(raw);
    }
  }

  // 요약 결과 만들기
  const out: MonthIndicatorMap = {};
  for (const [ymd, medMap] of byDateByMed.entries()) {
    const dots: DayDot[] = [];
    for (const [medicine_id, { label, statuses }] of medMap.entries()) {
      const finalStatus = summarizeStatus(statuses);
      dots.push({ medicine_id, label, status: finalStatus });
    }
    // 심각도 높은 순 → 라벨 가나다(ko) 순
    dots.sort((a, b) => {
      const diff = ORDER[b.status] - ORDER[a.status];
      return diff !== 0 ? diff : a.label.localeCompare(b.label, "ko");
    });
    out[ymd] = dots;
  }
  return out;
}

/** 태그 규약 */
export function monthTag(userId: string, anyYmdInMonth: string) {
  const { ym } = monthParts(anyYmdInMonth);
  return `intake:summary:${userId}:${ym}`;
}

/**  동적 태그를 등록하는 캐시 래퍼 */
export async function getMonthIndicatorMap(userId: string, centerYmd: string) {
  const { ym } = monthParts(centerYmd);
  const tag = monthTag(userId, centerYmd);

  const cached = unstable_cache(
    async () => _buildMonthIndicatorMap(userId, centerYmd),
    ["intake", "summary", userId, ym],
    { revalidate: 600, tags: [tag] }
  );
  return cached();
}

/**  무효화 헬퍼: YYYY-MM 기준으로 invalidate */
export function revalidateMonthIndicator(userId: string, dateYmd: string) {
  return revalidateTag(monthTag(userId, dateYmd));
}
