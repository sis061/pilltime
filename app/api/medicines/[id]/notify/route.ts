/**
 * 약별 알림 토글 API
 * - PATCH /api/medicines/:id/notify  { enabled: boolean }
 * - 동작: 해당 약의 "내" 스케줄들(medicine_schedules) 모두 is_notify = enabled 로 일괄 업데이트
 * - 소유권 검증: medicines.user_id === auth.uid()
 * - RLS 전제: user가 자신의 rows만 update 가능해야 함(아래 정책 참고)
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const BodySchema = z.object({ enabled: z.boolean() });

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { supabase, res } = await createRouteSupabaseClient(req);

  // 0) 파라미터/바디 검증
  const medicineId = Number(id);
  if (!Number.isFinite(medicineId)) {
    return NextResponse.json(
      { message: "Invalid medicine id" },
      { status: 400, headers: res.headers }
    );
  }

  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Bad Request" },
      { status: 400, headers: res.headers }
    );
  }
  const { enabled } = parsed.data;

  // 1) 세션/유저
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401, headers: res.headers }
    );
  }

  // 2) 약 소유권 검증
  const { data: med, error: medErr } = await supabase
    .from("medicines")
    .select("id, user_id")
    .eq("id", medicineId)
    .maybeSingle();

  if (medErr) {
    return NextResponse.json(
      { message: medErr.message },
      { status: 500, headers: res.headers }
    );
  }
  if (!med || med.user_id !== user.id) {
    return NextResponse.json(
      { message: "Forbidden" },
      { status: 403, headers: res.headers }
    );
  }

  // 3) 스케줄 일괄 업데이트 (soft-deleted 제외)
  const { data, error } = await supabase
    .from("medicine_schedules")
    .update({ is_notify: enabled })
    .eq("medicine_id", medicineId)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500, headers: res.headers }
    );
  }

  // 4) 응답 (Set-Cookie 반영 위해 headers 전달)
  return NextResponse.json(
    { medicine_id: medicineId, enabled, affected: data?.length ?? 0 },
    { status: 200, headers: res.headers }
  );
}
