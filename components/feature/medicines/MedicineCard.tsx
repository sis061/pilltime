import { Info, Settings } from "lucide-react";
import Image from "next/image";
import ScheduleItem from "./ScheduleItem";
import Link from "next/link";
import { MedicineDetail, RepeatedPattern } from "@/app/types/medicines";

/**
 * 오늘 복용해야 하는 약인지 여부를 반환
 * DAILY → 항상 true
 * WEEKLY → 오늘 요일이 daysOfWeek에 포함되면 true
 * MONTHLY → 오늘 날짜가 daysOfMonth에 포함되면 true
 */
export const RenderTodaysMedicine = (pattern: RepeatedPattern) => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: pattern.tz,
    weekday: "short",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const dayOfMonth = Number(parts.find((p) => p.type === "day")?.value);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = weekdayMap[weekdayStr] ?? 0;

  switch (pattern.type) {
    case "DAILY":
      return true;
    case "WEEKLY":
      return pattern.days_of_week?.includes(weekday) ?? false;
    case "MONTHLY":
      return pattern.days_of_month?.includes(dayOfMonth) ?? false;
    default:
      return false;
  }
};

export default function MedicineCard(medicine: MedicineDetail) {
  const { id, name, imageUrl, description, schedules } = medicine;
  const isMedicineTakenToday = RenderTodaysMedicine(
    schedules[0]?.repeated_pattern
  );

  return (
    <>
      <div className="border-2 bg-white border-pilltime-blue/50 rounded-md !px-4 !py-8 flex flex-col gap-4 shadow-md">
        <div className="flex items-center gap-4 w-full relative">
          <div className="rounded-md overflow-hidden border border-pilltime-violet/50 shadow-sm">
            <Image
              src={imageUrl}
              // src={"/fallback-medicine.png"}
              alt="fallback-medicine"
              width={120}
              height={120}
            />
          </div>
          <div className="grow">
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="font-bold !text-pilltime-grayDark">{name}</span>
            </div>
          </div>

          <div className="absolute -top-4 right-0">
            <div className="flex items-center justify-between gap-2">
              <Info
                size={20}
                className="cursor-pointer"
                strokeWidth={2.5}
                color="#F9731690"
              />
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
            <div className="absolute top-0 left-0 bg-black/75 w-full h-full rounded-sm z-10 flex items-center justify-center">
              <span className="!text-white font-bold text-xl">
                오늘은 먹을 약이 없네요!
              </span>
            </div>
          )}
          <ul
            className={`flex flex-col gap-4 ${
              !isMedicineTakenToday && "blur-xs"
            }`}
          >
            {schedules.map((schedule) => (
              <li key={schedule?.id}>
                <ScheduleItem {...schedule} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
