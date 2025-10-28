import { NextResponse, type NextRequest } from "next/server";
import type { DayIntakeResponse } from "@/types/calendar";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date (YYYY-MM-DD) required" },
      { status: 400 }
    );
  }

  // Route Handler 전용: req에서 읽고 res에 Set-Cookie 기록
  const { supabase, res } = await createRouteSupabaseClient(req);

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: res.headers }
    );
  }

  const { data, error } = await supabase
    .from("intake_logs")
    .select(
      `
      id, status, time, schedule_id, medicine_id, source,
      medicines!left(name, deleted_at),
      medicine_schedules!left(id, deleted_at)
    `
    )
    .eq("user_id", user.id)
    .eq("date", date)
    .order("time", { ascending: true, nullsFirst: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: res.headers }
    );
  }

  const items =
    (data ?? []).map((row: any) => {
      const name: string = row.medicines?.name ?? "";
      const hhmm: string =
        typeof row.time === "string" ? row.time.slice(0, 5) : "";

      return {
        intake_id: String(row.id),
        schedule_id: String(row.schedule_id),
        medicine_id: String(row.medicine_id),
        medicine_name: name,
        time: hhmm,
        status: row.status as any,
        source: row.source ?? undefined,
      };
    }) ?? [];

  const payload: DayIntakeResponse = { date, items };
  // Set-Cookie 포함해서 응답
  return NextResponse.json(payload, { headers: res.headers });
}
