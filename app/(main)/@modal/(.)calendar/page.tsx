import { Metadata } from "next";
import CalendarClient from "@/components/feature/calendars/CalendarClient";
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

export default async function CalendarInterceptPage({
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

  // onClose는 router.back()
  // (주의: Client 컴포넌트 내부에서 처리됨)
  return (
    <CalendarClient
      variant="drawer"
      dateParam={d ?? null}
      monthMap={monthMap}
      todayYmd={today}
      onClose={undefined /* CalendarClient 내부에서 optional 처리 */}
    />
  );
}
