"use client";

// import Image from "next/image";
import { Info, Settings } from "lucide-react";
import ScheduleItem from "./ScheduleItem";
import Link from "next/link";
import { IntakeLog, MedicineDetail } from "@/types/medicines";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ZoomableImage } from "@/components/layout/ZoomableImage";
import { RenderTodaysMedicine } from "@/lib/medicine";

import TodayProgress from "./TodayProgress";
import { useEffect, useMemo, useState } from "react";
import { toYYYYMMDD } from "@/lib/date";

export default function MedicineCard(medicine: MedicineDetail) {
  const { id, name, imageUrl, description, schedules } = medicine;
  // logId -> 원하는(낙관) status
  const [pending, setPending] = useState<Record<number, IntakeLog["status"]>>(
    {}
  );
  const onOptimisticSet = (logId: number, status: IntakeLog["status"]) =>
    setPending((p) => ({ ...p, [logId]: status })); // ✅ 성공 시에는 더 이상 즉시 지우지 않음
  const onOptimisticClear = (logId: number) =>
    setPending(({ [logId]: _omit, ...rest }) => rest);

  // ✅ 리컨실리에이션: 실제 스케줄 데이터가 pending과 같아지면 그 때만 pending 제거
  useEffect(() => {
    if (!schedules?.length) return;
    const dateStr = toYYYYMMDD(new Date());
    const actual = new Map<number, IntakeLog["status"]>();
    schedules
      .flatMap((s) => s.intake_logs)
      .filter((l) => l.date === dateStr)
      .forEach((l) => actual.set(l.id, l.status));
    setPending((prev) => {
      const next = { ...prev };
      for (const [idStr, desired] of Object.entries(prev)) {
        const id = Number(idStr);
        if (actual.get(id) === desired) {
          delete next[id];
        }
      }
      return next;
    });
  }, [schedules]);
  const isMedicineTakenToday = useMemo(
    () => RenderTodaysMedicine(schedules[0]?.repeated_pattern),
    [schedules]
  );

  return (
    <>
      <div className="border-2 bg-white border-pilltime-blue/50 rounded-md !px-4 !pb-8 !pt-12 flex flex-col gap-4 shadow-md">
        <div className="flex items-center gap-4 w-full relative">
          <div className="rounded-md overflow-hidden border border-pilltime-violet/50 shadow-sm">
            <ZoomableImage
              src={imageUrl}
              alt="fallback-medicine"
              width={120}
              height={120}
            />
            {/* <Image
              src={imageUrl}
              alt="fallback-medicine"
              width={120}
              height={120}
            /> */}
          </div>
          <div className="grow self-start !z-10">
            <span className="font-bold !text-pilltime-grayDark text-2xl text-ellipsis text-shadow-sm backdrop-blur-2xl">
              {name}
            </span>
          </div>
          <TodayProgress
            schedules={schedules}
            pending={pending}
            className="w-28 h-28 absolute right-2 -bottom-2"
          />

          <div className="absolute -top-8 right-0">
            <div className="flex items-center justify-between gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Info
                    size={20}
                    className="cursor-pointer"
                    strokeWidth={2.5}
                    color="#F9731690"
                  />
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  sideOffset={4}
                  alignOffset={8}
                  className="max-w-48 !min-w-24 border-2 bg-white rounded-md !py-3 !px-2 *:text-[16px] !border-[#F9731690] shadow-lg transition-opacity duration-150 "
                >
                  {description.length > 0 ? (
                    <ul className="flex flex-col gap-1 list-disc [&_>li]:!ml-4 w-full">
                      {description.map((text, i) => (
                        <li key={i}>{text}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="!text-pilltime-grayDark/50 text-center">
                      상세 정보가 없습니다!
                    </p>
                  )}
                </PopoverContent>
              </Popover>

              <Link href={`/medicines/${id}/edit`}>
                <Settings
                  size={20}
                  className="cursor-pointer"
                  strokeWidth={2.5}
                  color="#F97316"
                />
              </Link>
            </div>
          </div>
        </div>
        <div className="!py-4 !px-2 relative">
          {!isMedicineTakenToday && (
            <div className="absolute top-0 left-0 bg-black/50 w-full h-full rounded-sm z-10 flex items-center justify-center backdrop-blur-xs">
              <span className="!text-pilltime-grayLight font-bold text-lg">
                오늘은 먹을 약이 없네요!
              </span>
            </div>
          )}
          <ul className={`flex flex-col gap-4`}>
            {schedules.map((schedule) => (
              <li key={schedule?.id}>
                <ScheduleItem
                  {...schedule}
                  onOptimisticSet={onOptimisticSet}
                  onOptimisticClear={onOptimisticClear}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
