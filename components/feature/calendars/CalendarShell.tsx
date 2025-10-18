// components/feature/calendars/CalendarShell.tsx
"use client";

import * as React from "react";
import PillCalendar from "./PillCalendar";
import DayIntakeList from "./DayIntakeList";
import { toYYYYMMDD } from "@/lib/date";
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

function normalizeYmdKST(d: string | null) {
  const today = toYYYYMMDD(new Date(), "Asia/Seoul");
  if (!d) return today;
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : today;
}

export default function CalendarShell({
  dateParam,
  onChangeDate,
  layout,
  monthMap, // ✅ 서버 seed
  todayYmdOverride,
}: {
  dateParam: string | null;
  onChangeDate: (nextYmd: string) => void;
  layout: "drawer" | "page";
  monthMap?: MonthIndicatorMap; // ✅ seed
  todayYmdOverride?: string;
}) {
  const todayYmd = React.useMemo(
    () => todayYmdOverride ?? toYYYYMMDD(new Date(), "Asia/Seoul"),
    [todayYmdOverride]
  );
  const selectedYmd = normalizeYmdKST(dateParam);

  // 초기 viewMonth는 선택 월 1일
  const [viewMonth, setViewMonth] = React.useState<Date>(() => {
    const d = new Date(`${selectedYmd}T00:00:00+09:00`);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  React.useEffect(() => {
    const d = new Date(`${selectedYmd}T00:00:00+09:00`);
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [selectedYmd]);

  // ✅ 월별 캐시: { "YYYY-MM": MonthIndicatorMap }
  const seedYm = React.useMemo(() => selectedYmd.slice(0, 7), [selectedYmd]);
  const [monthCache, setMonthCache] = React.useState<
    Record<string, MonthIndicatorMap>
  >(() => (monthMap ? { [seedYm]: monthMap } : {}));

  // ✅ 보이는 달이 바뀌면 해당 월 요약을 on-demand 로드(중복 방지)
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

  // ✅ dotsOfDate: 현재 보이는 달의 monthMap에서 읽기(없으면 빈 배열)
  const dotsOfDate = React.useCallback(
    (ymd: string): DayDot[] => {
      const ym = ymd.slice(0, 7);
      const map = monthCache[ym];
      return map?.[ymd] ?? [];
    },
    [monthCache]
  );

  // ✅ 하루 상세 (변경 없음)
  const [dayItems, setDayItems] = React.useState<DayIntakeItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  async function fetchDay(dateYmd: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/day?date=${dateYmd}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as DayIntakeResponse;
        setDayItems(json.items ?? []);
      } else {
        setDayItems([]);
      }
    } finally {
      setLoading(false);
    }
  }
  React.useEffect(() => {
    fetchDay(selectedYmd);
  }, [selectedYmd]);

  return (
    <div
      className={
        layout === "page"
          ? "grid gap-4"
          : "grid gap-4 grid-rows-[auto_auto_1fr] h-full"
      }
    >
      <PillCalendar
        month={viewMonth}
        onMonthChange={setViewMonth}
        selectedYmd={selectedYmd}
        onSelectYmd={(ymd) => onChangeDate(ymd)}
        todayYmd={todayYmd}
        futureWindowDays={7}
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
          date={selectedYmd}
          items={dayItems}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
