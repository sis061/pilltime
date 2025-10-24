// components/feature/calendars/DayIntakeList.tsx
"use client";

import * as React from "react";
import { PacmanLoader } from "react-spinners";
import { formatTime } from "@/lib/date";
import { statusBadgeClass } from "./CalendarShell";
import type { DayIntakeItem } from "@/types/calendar";

function getIntakeSummary(intakes: DayIntakeItem[]): string[] {
  const statuses = intakes.map((i) => i.status);

  const hasScheduled = statuses.includes("scheduled");
  const hasSkipped = statuses.includes("skipped");
  const hasMissed = statuses.includes("missed");
  const allTaken = statuses.length > 0 && statuses.every((s) => s === "taken");

  const messages: string[] = [];

  if (hasMissed) messages.push("놓친 약이 있네요!");
  if (hasSkipped) messages.push("건너뛴 약이 있어요");
  if (hasScheduled) messages.push("남은 약이 있어요");
  if (allTaken) messages.push("다 먹었어요!");

  return messages;
}

export default function DayIntakeList({
  // date,
  items,
  isLoading,
}: {
  // date: string;
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
      <div className="w-full h-full flex items-center justify-center text-sm !text-pilltime-grayDark/75 ">
        이 날은 먹은 약이 없어요!
      </div>
    );
  }

  const groupedArr = Object.values(
    items.reduce<
      Record<
        string,
        {
          medicine_id: string;
          medicine_name: string;
          intakes: DayIntakeItem[];
        }
      >
    >((acc, item) => {
      const key = item.medicine_id;
      const name = item.medicine_name;
      if (!acc[key])
        acc[key] = { medicine_id: key, medicine_name: name, intakes: [] };

      acc[key].intakes.push(item);
      return acc;
    }, {})
  );

  return (
    <ul className="flex flex-wrap [@media(min-width:480px)]:grid grid-rows-2 grid-cols-2 gap-2 w-full !pb-8">
      {groupedArr.map((group) => (
        <li
          key={group.medicine_id}
          className="w-full flex items-center gap-4 rounded-md bg-[#fafafa] !p-4 bg-card text-base text-foreground shadow-sm border-1 border-pilltime-teal/10"
        >
          {/* 텍스트 -- 약 이름, 복용 상태 요약 */}
          <div className="flex flex-col gap-2 w-1/2 min-w-24 items-start justify-start h-full truncate">
            <h4 className="text-lg font-bold !text-pilltime-grayDark truncate !text-ellipsis w-full">
              {group.medicine_name}
            </h4>
            <div className="flex flex-col gap-1">
              {getIntakeSummary(group.intakes).map((message, i) => (
                <span key={i} className="text-xs !text-pilltime-grayDark/75">
                  {message}
                </span>
              ))}
            </div>
          </div>

          {/* 복용 시간별 상태 배지 */}
          <div className="flex flex-col grow gap-1 !py-1 items-start justify-start h-full ">
            {group.intakes.map((intake) => (
              <div
                key={intake.intake_id}
                className="flex items-center justify-center gap-1"
              >
                <span className="text-xs !text-pilltime-grayDark/75 w-14">
                  {formatTime(intake.time) ?? "--:--"}
                </span>
                <span
                  className={[
                    "inline-flex h-3 w-3 items-center justify-center rounded-full text-[11px] font-bold",
                    statusBadgeClass(intake.status),
                  ].join(" ")}
                />
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
