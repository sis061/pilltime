import { NextResponse, type NextRequest } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { revalidateMonthIndicator } from "@/lib/calendar/indicator";

export const runtime = "nodejs";

export async function PUT(req: NextRequest) {
  // Route Handler 전용: req에서 읽고, res에 Set-Cookie 기록
  const { supabase, res } = await createRouteSupabaseClient(req);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: res.headers } // 쿠키 전파
    );
  }

  const body = await req.json();
  const idNum = Number(body?.id);

  if (!idNum || !body?.status) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400, headers: res.headers } // 쿠키 전파
    );
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    status: body.status,
    source: body.source ?? "manual",
  };

  // taken/missed/skipped 확정 시에만 checked_at 갱신
  if (["taken", "missed", "skipped"].includes(body.status)) {
    updatePayload.checked_at = now;
  }

  const { data: updated, error } = await supabase
    .from("intake_logs")
    .update(updatePayload)
    .eq("id", idNum)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("date")
    .single();

  if (error) {
    console.error("DB Error:", error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: res.headers } // 쿠키 전파
    );
  }

  if (updated?.date) {
    await revalidateMonthIndicator(user.id, updated.date as string);
  }

  // 성공 응답에도 Set-Cookie 포함
  return NextResponse.json(
    { success: true },
    { status: 200, headers: res.headers }
  );
}
