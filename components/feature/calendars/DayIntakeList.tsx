// components/feature/calendars/DayIntakeList.tsx
"use client";

import * as React from "react";
import type { DayIntakeItem } from "@/types/calendar";
import { formatTime } from "@/lib/date";
import { PacmanLoader } from "react-spinners";

function statusBadgeClass(s: DayIntakeItem["status"]) {
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
function statusLabelKo(s: DayIntakeItem["status"]) {
  switch (s) {
    case "taken":
      return "먹었어요!";
    case "skipped":
      return "안 먹기로 했어요!";
    case "missed":
      return "놓쳤어요!!!";
    case "scheduled":
      return "아직 예정이에요";
  }
}

export default function DayIntakeList({
  date,
  items,
  isLoading,
}: {
  date: string;
  items: DayIntakeItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <PacmanLoader
          size={20}
          color="#14B8A6"
          className="!z-[99] self-center"
        />
      </div>
    );
  }
  if (!items?.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm !text-pilltime-grayDark/75">
        이 날은 먹은 약이 없어요!
      </div>
    );
  }

  return (
    <ul className="grid gap-2">
      {items.map((it) => (
        <li
          key={it.intake_id}
          className="flex items-center justify-between rounded-md bg-[#fafafa] !p-2 shadow-md"
        >
          <div className="flex items-center gap-4">
            {/* 이니셜 배지 */}
            <span
              className={[
                "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                statusBadgeClass(it.status),
              ].join(" ")}
              title={statusLabelKo(it.status)}
            >
              {/* {Array.from(it.medicine_name)[0]?.toUpperCase?.() ?? "?"} */}
            </span>
            {/* 텍스트 */}
            <div className="flex flex-col min-w-16 max-w-24 truncate">
              <span className="text-sm font-bold !text-pilltime-grayDark">
                {it.medicine_name}
              </span>
              <span className="text-xs  !text-pilltime-grayDark/90">
                {formatTime(it.time) ?? "시간 없음"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs !text-pilltime-grayDark/75">
                {statusLabelKo(it.status)}
              </span>
            </div>
          </div>

          {/* (향후 액션 자리) */}
          {/* <Button size="sm" variant="ghost">수정</Button> */}
        </li>
      ))}
    </ul>
  );
}
