// components/feature/calendars/CalendarShell.tsx
"use client";

// ---- REACT
import * as React from "react";
// ---- COMPONENT
import PillCalendar from "./PillCalendar";
import DayIntakeList from "./DayIntakeList";
// ---- UTIL
import {
  addDays,
  dateFromYmdKST,
  startOfMonthKST,
  todayYmdKST,
  ymdKST,
} from "@/lib/date";
// ---- STORE
import { useGlobalLoading } from "@/store/useGlobalLoading";
// ---- TYPE
import type {
  MonthIndicatorMap,
  DayDot,
  DayIntakeItem,
  DayIntakeResponse,
} from "@/types/calendar";

const STATUS = [
  {
    enum: "taken",
    kr: "복용",
    badgeClass: statusBadgeClass("taken"),
  },
  {
    enum: "skipped",
    kr: "건너뜀",
    badgeClass: statusBadgeClass("skipped"),
  },
  {
    enum: "missed",
    kr: "미복용",
    badgeClass: statusBadgeClass("missed"),
  },
  {
    enum: "scheduled",
    kr: "예정",
    badgeClass: statusBadgeClass("scheduled"),
  },
] as const;

/* ------
 function
------ */

function normalizeYmd(ymd: string | null, maxFutureDays: number) {
  const today = todayYmdKST();
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return today;
  const max = ymdKST(addDays(dateFromYmdKST(today), maxFutureDays));
  return ymd > max ? max : ymd;
}

const ymOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export function statusBadgeClass(s: DayIntakeItem["status"]) {
  switch (s) {
    case "taken":
      return "bg-pilltime-blue !text-white";
    case "skipped":
      return "bg-pilltime-yellow !text-white";
    case "missed":
      return "bg-red-700 !text-pilltime-teal";
    case "scheduled":
      return "bg-gray-400 !text-white";
  }
}

export default function CalendarShell(props: {
  dateParam: string | null;
  onChangeDate: (d: string) => void;
  layout: "drawer" | "page";
  monthMap?: MonthIndicatorMap;
  todayYmdOverride?: string;
}) {
  const setGLoading = useGlobalLoading((s) => s.setGLoading);

  const futureWindowDays = 7;
  const todayYmd = React.useMemo(
    () => props.todayYmdOverride ?? todayYmdKST(),
    [props.todayYmdOverride]
  );
  const selectedYmd = normalizeYmd(props.dateParam, futureWindowDays);

  // 초기 viewMonth = 선택월 1일(KST)
  const [viewMonth, setViewMonth] = React.useState<Date>(() =>
    startOfMonthKST(dateFromYmdKST(selectedYmd))
  );

  // 같은 달이면 setViewMonth 회피
  React.useEffect(() => {
    const nextFirst = startOfMonthKST(dateFromYmdKST(selectedYmd));
    if (
      viewMonth.getFullYear() !== nextFirst.getFullYear() ||
      viewMonth.getMonth() !== nextFirst.getMonth()
    ) {
      setViewMonth(nextFirst);
    }
  }, [selectedYmd, viewMonth]);

  // 월별 캐시: { "YYYY-MM": MonthIndicatorMap }
  const seedYm = React.useMemo(() => selectedYmd.slice(0, 7), [selectedYmd]);
  const [monthCache, setMonthCache] = React.useState<
    Record<string, MonthIndicatorMap>
  >(() => (props?.monthMap ? { [seedYm]: props?.monthMap } : {}));

  // 보이는 달이 바뀌면 해당 월 요약을 on-demand 로드(중복 방지)
  React.useEffect(() => {
    const ym = ymOf(viewMonth);
    if (monthCache[ym]) return; // 이미 있음

    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/calendar/month?ym=${ym}`, {
          signal: ac.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          ym: string;
          monthMap: MonthIndicatorMap;
        };
        setMonthCache((prev) => ({ ...prev, [json.ym]: json.monthMap }));
      } catch {}
    })();

    return () => ac.abort();
  }, [viewMonth, monthCache]);

  // dotsOfDate: 현재 보이는 달의 monthMap에서 읽기(없으면 빈 배열)
  const dotsOfDate = React.useCallback(
    (ymd: string): DayDot[] => {
      const ym = ymd.slice(0, 7);
      const map = monthCache[ym];
      return map?.[ymd] ?? [];
    },
    [monthCache]
  );

  // 하루 상세 — 최신 요청만 반영
  const [dayItems, setDayItems] = React.useState<DayIntakeItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const reqIdRef = React.useRef(0);
  const abortRef = React.useRef<AbortController | null>(null);

  async function fetchDay(dateYmd: string) {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const myId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/day?date=${dateYmd}`, {
        cache: "no-store",
        signal: ac.signal,
      });
      const json = res.ok
        ? ((await res.json()) as DayIntakeResponse)
        : { items: [] };
      if (reqIdRef.current === myId) setDayItems(json.items ?? []);
    } catch {
      if (reqIdRef.current === myId) setDayItems([]);
    } finally {
      if (reqIdRef.current === myId) setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchDay(selectedYmd);
    setGLoading(false);
    return () => abortRef.current?.abort();
  }, [selectedYmd]);

  return (
    <div
      className={
        props.layout === "page"
          ? "grid gap-4"
          : "grid gap-4 grid-rows-[auto_auto_1fr] h-full"
      }
    >
      <PillCalendar
        month={viewMonth}
        onMonthChange={setViewMonth}
        selectedYmd={selectedYmd}
        todayYmd={todayYmd}
        onSelectYmd={(ymd) => props.onChangeDate(ymd)}
        futureWindowDays={futureWindowDays}
        dotsOfDate={dotsOfDate}
      />
      <ul className="flex items-center justify-center gap-4 w-full !px-2 !-mb-1">
        {STATUS.map((s, i) => (
          <li key={i} className="flex items-center justify-center gap-1">
            <span
              className={[
                "inline-flex h-3 w-3 items-center justify-center rounded-full text-[11px] font-bold ",
                s.badgeClass,
              ].join(" ")}
            />
            <span className="text-xs !text-pilltime-grayDark/75">{s.kr}</span>
          </li>
        ))}
      </ul>
      <div className={"rounded-lg overflow-y-auto"}>
        <DayIntakeList
          // date={selectedYmd}
          items={dayItems}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
