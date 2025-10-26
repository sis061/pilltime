"use client";

import { useRouter } from "next/navigation";
import CalendarDrawer from "@/components/feature/calendars/legacy_CalendarDrawer";
import type { MonthIndicatorMap } from "@/types/calendar";

export default function CalendarDrawerClient({
  dateParam,
  monthMap,
  todayYmd,
}: {
  dateParam: string | null;
  monthMap: MonthIndicatorMap;
  todayYmd: string;
}) {
  const router = useRouter();
  return (
    <CalendarDrawer
      open={true}
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
      dateParam={dateParam}
      monthMap={monthMap}
      todayYmd={todayYmd}
    />
  );
}
