import Link from "next/link";
import { CalendarSearch } from "lucide-react";

export default function HomeToday() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");

  return (
    <div className="flex items-center justify-center md:justify-end w-full [&_*]:!text-pilltime-grayDark/50">
      <Link
        href={`/calendar?d=${y}-${m}-${d}`}
        className="flex gap-2 items-center justify-center shadow-xs !py-2 !px-4 rounded-md [&_h3]:!text-lg [&_span]:!text-[16px] [&_span]:opacity-75 hover:opacity-90"
        aria-label="달력 열기"
      >
        <CalendarSearch size={16} />
        <h3>
          {today.getMonth() + 1}
          <span>월</span> {today.getDate()}
          <span>일</span>
        </h3>
        <h3>
          {today.toLocaleDateString("ko-KR", { weekday: "short" })}
          <span>요일</span>
        </h3>
      </Link>
    </div>
  );
}
