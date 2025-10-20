"use client";

import * as React from "react";
// ---- UI
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
// ---- UTIL
import { statusBadgeClass } from "./CalendarShell";
import { toYYYYMMDD } from "@/lib/date";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
// ---- TYPE
import type { DayDot } from "@/types/calendar"; // { medicine_id, label, status }

export default function PillCalendar({
  month,
  onMonthChange,
  selectedYmd,
  onSelectYmd,
  todayYmd,
  dotsOfDate,
  futureWindowDays = 7,
}: {
  month: Date;
  onMonthChange: (m: Date) => void;

  selectedYmd: string;
  onSelectYmd: (ymd: string, hasLogs: boolean) => void;

  todayYmd: string;

  /** 날짜별 배지(이니셜+상태색) */
  dotsOfDate: (ymd: string) => DayDot[];

  futureWindowDays?: number;
}) {
  // 선택된 날짜(Date) — KST 자정 고정
  const selectedDate = React.useMemo(
    () => new Date(`${selectedYmd}T00:00:00+09:00`),
    [selectedYmd]
  );

  // 오늘 + 윈도우 상한 (Date)
  const maxAllowedDate = React.useMemo(() => {
    const base = new Date(`${todayYmd}T00:00:00+09:00`);
    const max = new Date(base);
    max.setDate(max.getDate() + futureWindowDays);
    return max;
  }, [todayYmd, futureWindowDays]);

  // 상한 초과 날짜 비활성
  const disabledMatchers = React.useMemo(
    () => [
      (date: Date) =>
        toYYYYMMDD(date, "Asia/Seoul") >
        toYYYYMMDD(maxAllowedDate, "Asia/Seoul"),
    ],
    [maxAllowedDate]
  );

  return (
    <div className="rounded-lg bg-card text-base text-foreground w-full shadow-md">
      <Calendar
        /* 제어형 월 네비 (1일로 고정 이동) */
        month={month}
        onMonthChange={(m) =>
          onMonthChange(new Date(m.getFullYear(), m.getMonth(), 1))
        }
        /* 단일 선택 */
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          if (!date) return;
          const ymd = toYYYYMMDD(date, "Asia/Seoul");
          if (ymd > toYYYYMMDD(maxAllowedDate, "Asia/Seoul")) return;
          const has = (dotsOfDate(ymd).length ?? 0) > 0;
          onSelectYmd(ymd, has);
        }}
        disabled={disabledMatchers}
        captionLayout="label"
        showOutsideDays
        weekStartsOn={0}
        locale={ko}
        formatters={{
          // ✅ 달 캡션: "2025년 10월"
          formatCaption: (month) => format(month, "yyyy년 M월", { locale: ko }),
          // ✅ 요일 헤더: "일","월","화","수","목","금","토"
          formatWeekdayName: (date) => format(date, "EEEEE", { locale: ko }),
          // (옵션) 날짜 툴팁/접근성 라벨 기본 포맷 변경
          formatDay: (date) => format(date, "d", { locale: ko }),
        }}
        labels={{
          // ✅ 스크린리더용 라벨도 한글로
          labelDayButton: (date) =>
            format(date, "yyyy년 M월 d일 (EEE)", { locale: ko }),
          // 필요시 다음/이전 달 버튼 라벨도 한글화
          labelNext: () => "다음 달",
          labelPrevious: () => "이전 달",
        }}
        className={[
          "w-full !p-2",
          "[&_.rdp-table]:table-fixed [&_.rdp-table]:w-full",
          "[&_.rdp-head_cell]:p-0",
          "[&_.rdp-cell]:p-0 [&_.rdp-cell]:align-top",
          "[&_.rdp-day]:aspect-auto [&_.rdp-day]:w-full",
          "[&_.rdp-day]:h-[calc(var(--cell-size)*1.20)] md:[&_.rdp-day]:h-[calc(var(--cell-size)*1.25)]",
          "[&_.rdp-day]:box-border",
          "[--cell-size:--spacing(11)] md:[--cell-size:--spacing(13)]",
        ].join(" ")}
        classNames={{
          day: "w-full outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 transition-none !p-1",
        }}
        modifiersClassNames={{
          today: "bg-pilltime-blue/15 text-foreground rounded-md",
          selected: "ring-2 ring-pilltime-blue rounded-md",
        }}
        components={{
          DayButton: ({ children, modifiers, day, ...props }) => {
            const ymd = toYYYYMMDD(day.date, "Asia/Seoul");
            const dots = dotsOfDate(ymd);
            const hasLogs = dots.length > 0;

            // 최대 3개만 보이고, 넘어가면 +n 표시
            const shown = dots.slice(0, 3);
            const extra = dots.length - shown.length;

            return (
              <CalendarDayButton
                day={day}
                modifiers={modifiers}
                {...props}
                className={[
                  "flex flex-col items-center justify-start gap-1 cursor-pointer",
                  // modifiers.today && !modifiers.selected
                  //   ? "bg-pilltime-blue text-white ring-2 ring-pilltime-blue"
                  //   : "",
                  // modifiers.selected ? "ring-2 ring-pilltime-blue" : "",
                  (props as any).className ?? "",
                ].join(" ")}
              >
                {children}
                {!modifiers.outside && hasLogs && (
                  <div className="mt-1 flex flex-col items-center justify-center gap-0.5">
                    {shown.map((d, i) => (
                      <span
                        key={`${ymd}-${d.medicine_id}-${i}`}
                        className={[
                          "inline-flex items-center justify-center",
                          "h-1 w-4 rounded-full",
                          statusBadgeClass(d.status),
                        ].join(" ")}
                        title={`${d.label} · ${d.status}`}
                        aria-hidden="true"
                      >
                        {/* {d.label} */}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span
                        className="inline-flex items-center justify-center h-4 px-1 rounded-full text-[10px] font-bold bg-muted !text-pilltime-grayDark/75"
                        aria-hidden="true"
                        title={`+${extra}`}
                      >
                        +{extra}
                      </span>
                    )}
                  </div>
                )}
              </CalendarDayButton>
            );
          },
        }}
      />
    </div>
  );
}
