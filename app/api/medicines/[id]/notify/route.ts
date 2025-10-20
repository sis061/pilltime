// app/api/medicines/[id]/notify/route.ts
/**
 * 약별 알림 토글 API
 * - PATCH /api/medicines/:id/notify  { enabled: boolean }
 * - 동작: 해당 약의 "내" 스케줄들(medicine_schedules) 모두 is_notify = enabled 로 일괄 업데이트
 * - 소유권 검증: medicines.user_id === auth.uid()
 * - RLS 전제: user가 자신의 rows만 update 가능해야 함(아래 정책 참고)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 너의 프로젝트 util 사용

// 요청 바디 검증
const BodySchema = z.object({ enabled: z.boolean() });

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    // 0) 파라미터/바디 검증
    const medicineId = Number(id);
    if (!Number.isFinite(medicineId)) {
      return NextResponse.json(
        { message: "Invalid medicine id" },
        { status: 400 }
      );
    }
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ message: "Bad Request" }, { status: 400 });
    }
    const { enabled } = parsed.data;

    // 1) 세션/유저
    const supabase = await createServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // 2) 약 소유권 검증
    const { data: med, error: medErr } = await supabase
      .from("medicines")
      .select("id, user_id")
      .eq("id", medicineId)
      .maybeSingle();

    if (medErr) {
      return NextResponse.json({ message: medErr.message }, { status: 500 });
    }
    if (!med || med.user_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 3) 스케줄 일괄 업데이트 (soft-deleted 제외)
    const { data, error } = await supabase
      .from("medicine_schedules")
      .update({ is_notify: enabled })
      .eq("medicine_id", medicineId)
      .is("deleted_at", null)
      .select("id"); // 영향 개수 확인용

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // 4) 응답: 최종 enabled 및 영향 개수
    return NextResponse.json(
      {
        medicine_id: medicineId,
        enabled,
        affected: data?.length ?? 0,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { message: String(e?.message || e) },
      { status: 500 }
    );
  }
}
