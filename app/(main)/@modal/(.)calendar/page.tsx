// ---- COMPONENT
import CalendarDrawerClient from "@/components/feature/calendars/CalendarDrawerClient";
// ---- UTIL
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMonthIndicatorMap } from "@/lib/calendar/indicator";
import { toYYYYMMDD } from "@/lib/date";

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

  return (
    <CalendarDrawerClient
      dateParam={d ?? null}
      todayYmd={today}
      monthMap={monthMap}
    />
  );
}
