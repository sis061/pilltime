"use client";

import * as React from "react";
// ---- UI
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
// ---- UTIL
import { statusBadgeClass } from "./CalendarShell";
import { dateFromYmdKST, ymdKST } from "@/lib/date";
import { ko } from "date-fns/locale";
import { addDays, format } from "date-fns";
// ---- TYPE
import type { PillCalendarProps } from "@/types/calendar";

export default function PillCalendar({
  month,
  onMonthChange,
  selectedYmd,
  onSelectYmd,
  todayYmd,
  dotsOfDate,
  futureWindowDays = 7,
}: PillCalendarProps) {
  // 선택된 날짜(Date) — KST 자정 고정
  const selectedDate = React.useMemo(
    () => dateFromYmdKST(selectedYmd),
    [selectedYmd]
  );

  // 오늘 + 윈도우 상한 (Date)
  const maxAllowedYmd = React.useMemo(
    () => ymdKST(addDays(dateFromYmdKST(todayYmd), futureWindowDays)),
    [todayYmd, futureWindowDays]
  );

  // 상한 초과 날짜 비활성
  const disabledMatchers = React.useMemo(
    () => [(date: Date) => ymdKST(date) > maxAllowedYmd],
    [maxAllowedYmd]
  );

  const formatters = React.useMemo(
    () => ({
      formatCaption: (m: Date) => format(m, "yyyy년 M월", { locale: ko }),
      formatWeekdayName: (d: Date) => format(d, "EEEEE", { locale: ko }),
      formatDay: (d: Date) => format(d, "d", { locale: ko }),
    }),
    []
  );

  const labels = React.useMemo(
    () => ({
      labelDayButton: (date: Date) =>
        format(date, "yyyy년 M월 d일 (EEE)", { locale: ko }),
      labelNext: () => "다음 달",
      labelPrevious: () => "이전 달",
    }),
    []
  );

  const DayButton = React.useMemo(() => {
    return React.memo(function DayBtn({
      children,
      modifiers,
      day,
      ...props
    }: any) {
      const ymd = ymdKST(day.date);
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
          className="flex flex-col items-center justify-start gap-1 transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-95"
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
    });
  }, [dotsOfDate]);

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
          const ymd = ymdKST(date);
          if (ymd > maxAllowedYmd) return;
          onSelectYmd(ymd);
        }}
        disabled={disabledMatchers}
        captionLayout="label"
        showOutsideDays
        weekStartsOn={0}
        locale={ko}
        formatters={formatters}
        labels={labels}
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
          button_previous:
            "transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110",
          button_next:
            "transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110",
        }}
        modifiersClassNames={{
          today: "bg-pilltime-blue/15 text-foreground rounded-md",
          selected: "ring-2 ring-pilltime-blue rounded-md",
        }}
        components={{
          DayButton: (props) => <DayButton {...props} />,
        }}
      />
    </div>
  );
}
