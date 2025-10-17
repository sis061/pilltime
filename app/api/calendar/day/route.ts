// app/api/calendar/day/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DayIntakeResponse } from "@/types/calendar";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date (YYYY-MM-DD) required" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ 스키마 반영: date, time, status, schedule_id 사용. note 제거.
  // medicines join으로 name 가져오기.
  const { data, error } = await supabase
    .from("intake_logs")
    .select(
      "id, status, time, schedule_id, medicine_id, source, medicines(name)"
    )
    .eq("user_id", user.id)
    .eq("date", date)
    .order("time", { ascending: true, nullsFirst: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items =
    (data ?? []).map((row: any) => {
      const name: string = row.medicines?.name ?? "";
      // time: "HH:MM:SS" 형태일 수 있으므로 앞 5자리 "HH:MM"만 사용
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
  return NextResponse.json(payload);
}
