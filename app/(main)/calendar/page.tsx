import { Metadata } from "next";
import Image from "next/image";
import CalendarClientPage from "@/components/feature/calendars/CalendarClientPage";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMonthIndicatorMap } from "@/lib/calendar/indicator";
import { toYYYYMMDD } from "@/lib/date";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}): Promise<Metadata> {
  const { d } = await searchParams;
  return {
    title: `지난 기록 보기 | ${d}`,
    description: `${d}의 지난 기록 보기`,
    openGraph: {
      title: `아맞다약!`,
      description: `${d}의 기록 보기`,
      images: ["/icon-512.png"],
    },
  };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = toYYYYMMDD(new Date(), "Asia/Seoul");
  const monthMap = await getMonthIndicatorMap(user.id, today);

  return (
    <section className="inner min-h-[calc(100dvh-10.75rem)] max-h-screen !mx-auto !w-full h-full !mt-2 sm:!mt-4 !mb-4.5 sm:!mb-4 !p-2">
      <CalendarClientPage
        variant="page"
        dateParam={d ?? null}
        monthMap={monthMap}
        todayYmd={today}
      />
      <div className="flex items-center justify-center mx-auto w-full fixed bottom-14 left-0">
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
    </section>
  );
}
