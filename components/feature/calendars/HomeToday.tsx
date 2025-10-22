"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarSearch } from "lucide-react";
import { toYYYYMMDD } from "@/lib/date";
import { useGlobalLoading } from "@/store/useGlobalLoading";

export default function HomeToday() {
  const router = useRouter();
  const setGLoading = useGlobalLoading((s) => s.setGLoading);

  const today = new Date();
  const kstNow = new Date(
    today.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const todayYmd = toYYYYMMDD(new Date(), "Asia/Seoul");

  return (
    <div className="flex items-center justify-center w-full [&_*]:!text-pilltime-grayDark/50">
      <Button
        variant="ghost"
        onClick={() => {
          router.push(`/calendar?d=${todayYmd}`);
          setGLoading(true, "정보를 불러오는 중이에요..");
        }}
        className="flex gap-2 items-center justify-center shadow-xs !py-2 !px-4 rounded-md [&_h3]:!text-lg [&_span]:!text-[16px] [&_span]:opacity-75 hover:opacity-90 cursor-pointer"
        aria-label={`${todayYmd} 눌러서 달력 열기`}
      >
        <CalendarSearch size={16} />
        <h3>
          {kstNow.getMonth() + 1}
          <span>월</span> {today.getDate()}
          <span>일</span>
        </h3>
        <h3>
          {kstNow.toLocaleDateString("ko-KR", { weekday: "short" })}
          <span>요일</span>
        </h3>
      </Button>
    </div>
  );
}
