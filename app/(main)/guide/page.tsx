import Link from "next/link";
import Image from "next/image";
import GuideDrawerClient from "./GuideDrawerClient";
import { ChevronRight } from "lucide-react";
import { type Metadata } from "next";

const STEPS = [
  { id: "new", title: "1. 새로운 약 등록", href: "/guide/new" },
  { id: "card", title: "2. 약 정보 확인", href: "/guide/card" },
  { id: "intake", title: "3. 복용 기록 남기기", href: "/guide/intake" },
  { id: "edit", title: "4. 약 정보 수정", href: "/guide/edit" },
  { id: "calendar", title: "5. 지난 기록 보기", href: "/guide/calendar" },
  { id: "settings", title: "6. 사용자 설정", href: "/guide/settings" },
] as const;

export const metadata: Metadata = {
  title: "아맞다약! | 사용 가이드",
  description: "아맞다약! 앱 사용법을 단계별로 안내합니다.",
};

export default function GuidePage() {
  return (
    <section className="inner min-h-[calc(100dvh-9.75rem)] max-h-screen !mx-auto !w-full h-full !mt-2 sm:!mt-4 !mb-2 !p-2">
      <div className="flex items-center justify-center mx-auto w-full !py-4">
        <h1 className="text-lg font-bold !text-pilltime-grayDark/50">
          사용 가이드
        </h1>
      </div>
      <div className="w-full flex items-center justify-center !py-4">
        <nav aria-label="가이드 단계 목록" className="!space-y-4 w-full h-full">
          {STEPS.map((s) => (
            <Link
              key={s.id}
              href={`/guide?step=${s.id}`}
              className="group block rounded-xl border border-white bg-white !p-4 !px-6 shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-pilltime-grayDark/90">
                  {s.title}
                </span>
                <ChevronRight
                  color="#1f293750"
                  className="h-5 w-5 transition group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center justify-center mx-auto w-full !py-4">
        <h3 className="flex items-center text-xs md:text-sm font-bold !text-pilltime-grayDark/50">
          목록으로 돌아가려면, 왼쪽 위에서
          <Image
            src="/pilltime_mark_duotone.svg"
            alt="PillTime 마크"
            width={32}
            height={32}
            className="-rotate-45"
            priority
          />{" "}
          를 눌러보세요!
        </h3>
      </div>
      <GuideDrawerClient />
    </section>
  );
}
