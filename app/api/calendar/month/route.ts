// app/api/calendar/month/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getMonthIndicatorMap } from "@/lib/calendar/indicator";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ym = url.searchParams.get("ym"); // "YYYY-MM"

  // ✅ 오늘(Asia/Seoul) 기준 "YYYY-MM-15" 형태의 기준일 계산
  const center =
    ym && /^\d{4}-\d{2}$/.test(ym)
      ? `${ym}-15`
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Seoul",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date()); // e.g. "2025-10-23"

  // ✅ Route Handler 전용 Supabase (req에서 읽고, res에 Set-Cookie 기록)
  const { supabase, res } = await createRouteSupabaseClient(req);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: res.headers }
    );
  }

  // ✅ getMonthIndicatorMap 내부가 쿠키 접근/갱신을 하지 않는다는 전제
  const monthMap = await getMonthIndicatorMap(user.id, center);

  // ✅ Set-Cookie 헤더 전파
  return NextResponse.json(
    { ym: center.slice(0, 7), monthMap },
    { status: 200, headers: res.headers }
  );
}
