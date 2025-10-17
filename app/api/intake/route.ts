import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidateMonthIndicator } from "@/lib/calendar/indicator";
export const runtime = "nodejs";

export async function PUT(req: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (!body?.id || !body?.status) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data: updated, error } = await supabase
    .from("intake_logs")
    .update({
      status: body.status,
      source: body.source,
      checked_at: body.checked_at,
    })
    .eq("id", Number(body.id))
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("date") // [NEW] 무효화용 날짜 회수
    .single();

  if (error) {
    console.error("DB Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (updated?.date) {
    await revalidateMonthIndicator(user.id, updated.date as string);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
