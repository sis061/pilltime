// app/api/calendar/month/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMonthIndicatorMap } from "@/lib/calendar/indicator";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ym = url.searchParams.get("ym"); // "YYYY-MM"
  const center =
    ym && /^\d{4}-\d{2}$/.test(ym)
      ? `${ym}-15`
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Seoul",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date()); // 오늘 KST

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 캐시된 요약을 그대로 활용 (unstable_cache + tag)
  const monthMap = await getMonthIndicatorMap(user.id, center);
  return NextResponse.json(
    { ym: center.slice(0, 7), monthMap },
    { status: 200 }
  );
}
