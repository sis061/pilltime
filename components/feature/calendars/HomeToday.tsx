"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarSearch } from "lucide-react";
import { toYYYYMMDD } from "@/lib/date";
import { useGlobalLoading } from "@/store/useGlobalLoading";

interface KstInit {
  ymd: string;
  month: string; // "11"
  day: string; // "9"
  weekday: string; // "일" 같은 짧은 요일
}

export default function HomeToday({ initial }: { initial: KstInit }) {
  const { ymd, month, day, weekday } = initial;
  const router = useRouter();
  const { startLoading } = useGlobalLoading();

  return (
    <div className="flex items-center justify-center w-full [&_*]:!text-pilltime-grayDark/50">
      <Button
        variant="ghost"
        onClick={() => {
          router.push(`/calendar?d=${ymd}`);
          startLoading("open-calendar", "정보를 불러오는 중이에요..");
        }}
        className="flex gap-2 items-center justify-center shadow-xs !py-2 !px-4 rounded-md [&_h3]:!text-lg [&_span]:!text-[16px] [&_span]:opacity-75 hover:opacity-90 transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-105"
        aria-label={`${ymd} 눌러서 달력 열기`}
      >
        <CalendarSearch size={16} />
        <h3 suppressHydrationWarning>
          {month}
          <span>월</span> {day}
          <span>일</span>
        </h3>
        <h3 suppressHydrationWarning>
          {weekday}
          <span>요일</span>
        </h3>
      </Button>
    </div>
  );
}
