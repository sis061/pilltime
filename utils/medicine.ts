import {
  MedicineDetail,
  MedicineSchedule,
  RepeatedPattern,
} from "@/app/types/medicines";

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

export function mapToCardModel(m: any): MedicineDetail {
  return {
    id: m.id,
    name: m.name,
    imageUrl: m.image_url ?? "",
    description: m.description ?? [],
    schedules: m.medicine_schedules ?? [],
  };
}

export function sortMedicinesByToday(
  medicines: MedicineDetail[]
): MedicineDetail[] {
  return [...medicines].sort((a, b) => {
    const aHasToday = a.schedules.some((s) =>
      RenderTodaysMedicine(s.repeated_pattern)
    );
    const bHasToday = b.schedules.some((s) =>
      RenderTodaysMedicine(s.repeated_pattern)
    );

    if (aHasToday === bHasToday) return 0;
    return aHasToday ? -1 : 1; // 오늘 복용하는 약 → 앞으로
  });
}

export function getTodayIntakeLog(data: MedicineSchedule) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return data.intake_logs.find((log) => log.date === today);
}
