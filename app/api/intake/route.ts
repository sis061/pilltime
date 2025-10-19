import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

  const now = new Date().toISOString();

  const updatePayload: Record<string, any> = {
    status: body.status,
    source: body.source ?? "manual",
  };

  // ✅ taken/missed/skip 등 상태가 확정될 때만 checked_at 갱신
  if (["taken", "missed", "skipped"].includes(body.status)) {
    updatePayload.checked_at = now;
  }

  const { data: updated, error } = await supabase
    .from("intake_logs")
    .update(updatePayload)
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
