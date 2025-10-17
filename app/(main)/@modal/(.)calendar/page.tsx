import CalendarDrawerClient from "@/components/feature/calendars/CalendarDrawerClient";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMonthIndicatorMap } from "@/lib/calendar/indicator";
import { toYYYYMMDD } from "@/lib/date";

export default async function CalendarInterceptPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const supabase = await createServerSupabaseClient(); // ✅ 여기는 캐시 밖 (페이지)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = toYYYYMMDD(new Date(), "Asia/Seoul");
  const monthMap = await getMonthIndicatorMap(user.id, today); // ✅ 캐시 안에선 쿠키 접근 없음

  return (
    <CalendarDrawerClient
      dateParam={d ?? null}
      todayYmd={today}
      monthMap={monthMap}
    />
  );
}
