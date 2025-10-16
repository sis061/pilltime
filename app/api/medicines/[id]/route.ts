import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("medicines")
    .select(
      `
      id,
      name,
      description,
      image_url,
      created_at,
      deleted_at,
      medicine_schedules (
        id,
        time,
        repeated_pattern,
        is_notify,
        deleted_at,
        intake_logs (
          id,
          date,
          time,
          status,
          checked_at
        )
      )
    `
    )
    .eq("id", Number(id))
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .filter("medicine_schedules.deleted_at", "is", null)
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // ✅ ADDED: 시간 정규화 유틸 (HH:mm → HH:mm:ss)
  const toHHMMSS = (t: string) => {
    const [h = "00", m = "00", s] = (t || "").split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${(s ?? "00").padStart(
      2,
      "0"
    )}`;
  };

  // -------------------------------
  // 1️⃣ 약 정보 업데이트 (dirty만)
  // -------------------------------
  // ✏️ CHANGED: undefined인 필드는 건드리지 않도록 부분 업데이트
  const medPatch: any = {
    updated_at: new Date().toISOString(),
  };
  if (body.name !== undefined) medPatch.name = body.name;
  if (body.description !== undefined)
    medPatch.description =
      body.description?.map((d: { value: string }) => d.value) ?? [];
  if (body.imageUrl !== undefined) medPatch.image_url = body.imageUrl ?? null;

  if (Object.keys(medPatch).length > 1) {
    const { error: medError } = await supabase
      .from("medicines")
      .update(medPatch)
      .eq("id", Number(id))
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (medError)
      return NextResponse.json({ error: medError.message }, { status: 500 });
  }

  // -------------------------------
  // 2️⃣ 스케줄 diff 부분 적용
  // -------------------------------
  // ✏️ CHANGED: 전량 삭제/재삽입 ❌, diff만 소비 ⭕
  const { schedules_changed, schedules_patch, repeated_pattern } = body ?? {};
  if (schedules_changed && schedules_patch) {
    // 기본 RP (프론트에서 넘어온 값, 없으면 DAILY)
    const baseRP = {
      tz: repeated_pattern?.tz ?? "Asia/Seoul",
      type: repeated_pattern?.type ?? "DAILY",
      days_of_week: repeated_pattern?.days_of_week ?? [],
      days_of_month: repeated_pattern?.days_of_month ?? [],
    };

    // 공통: 7일 윈도우
    const now = new Date();
    const fromStr = now.toISOString().slice(0, 10);
    const to = new Date(now);
    to.setDate(now.getDate() + 7);
    const toStr = to.toISOString().slice(0, 10);

    // --- INSERT ---
    if (
      Array.isArray(schedules_patch.insert) &&
      schedules_patch.insert.length
    ) {
      const insertRows = schedules_patch.insert.map((s: any) => ({
        user_id: user.id,
        medicine_id: Number(id),
        time: toHHMMSS(s.time),
        repeated_pattern: s.repeated_pattern ?? baseRP,
        is_notify: true,
      }));

      const { data: inserted, error } = await supabase
        .from("medicine_schedules")
        .insert(insertRows)
        .select("id");
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

      // 새 스케줄만 로그 생성
      for (const row of inserted ?? []) {
        // 미래 로그 리셋(예방적) 후 생성
        await supabase.rpc("reset_future_logs_for_schedule", {
          p_schedule_id: row.id,
        });
        const { error: genErr } = await supabase.rpc(
          "generate_logs_for_schedule",
          {
            p_schedule_id: row.id,
            p_from_date: fromStr,
            p_to_date: toStr,
          }
        );
        if (genErr)
          console.error("generate_logs(insert) error:", genErr.message);
      }
    }

    // --- UPDATE ---
    if (
      Array.isArray(schedules_patch.update) &&
      schedules_patch.update.length
    ) {
      for (const u of schedules_patch.update) {
        const patch: any = {};
        if (u.time !== undefined) patch.time = toHHMMSS(u.time);
        if (u.repeated_pattern !== undefined)
          patch.repeated_pattern = u.repeated_pattern;

        if (Object.keys(patch).length) {
          const { error } = await supabase
            .from("medicine_schedules")
            .update({ ...patch, updated_at: new Date().toISOString() })
            .eq("id", u.id)
            .eq("medicine_id", Number(id))
            .eq("user_id", user.id)
            .is("deleted_at", null);
          if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 해당 스케줄의 미래 로그만 리셋 후 재생성
        await supabase.rpc("reset_future_logs_for_schedule", {
          p_schedule_id: u.id,
        });
        const { error: genErr } = await supabase.rpc(
          "generate_logs_for_schedule",
          {
            p_schedule_id: u.id,
            p_from_date: fromStr,
            p_to_date: toStr,
          }
        );
        if (genErr)
          console.error("generate_logs(update) error:", genErr.message);
      }
    }

    // --- DELETE ---
    if (
      Array.isArray(schedules_patch.delete) &&
      schedules_patch.delete.length
    ) {
      const delIds: number[] = schedules_patch.delete;

      // 미래 로그만 삭제 (과거는 보존)
      const today = new Date().toISOString().slice(0, 10);
      const { error: delLogsErr } = await supabase
        .from("intake_logs")
        .delete()
        .in("schedule_id", delIds)
        .gte("date", today);
      if (delLogsErr)
        return NextResponse.json(
          { error: delLogsErr.message },
          { status: 500 }
        );

      // 스케줄 soft-delete
      const { error: softErr } = await supabase
        .from("medicine_schedules")
        .update({ deleted_at: new Date().toISOString(), is_notify: false })
        .in("id", delIds)
        .eq("medicine_id", Number(id))
        .eq("user_id", user.id)
        .is("deleted_at", null);
      if (softErr)
        return NextResponse.json({ error: softErr.message }, { status: 500 });
    }
  }

  // -------------------------------
  // 3️⃣ 완료 응답
  // -------------------------------
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // -------------------------------
  // 1️⃣ 해당 약의 스케줄 ID 목록 조회
  // -------------------------------
  const { data: schedules, error: scheduleError } = await supabase
    .from("medicine_schedules")
    .select("id")
    .eq("medicine_id", Number(id))
    .eq("user_id", user.id);

  if (scheduleError)
    return NextResponse.json({ error: scheduleError.message }, { status: 500 });

  const scheduleIds = schedules?.map((s) => s.id) ?? [];

  // -------------------------------
  // 2️⃣ 미래 로그만 삭제 (과거 로그는 유지)
  // -------------------------------
  if (scheduleIds.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const { error: logDeleteError } = await supabase
      .from("intake_logs")
      .delete()
      .in("schedule_id", scheduleIds)
      .gte("date", today);

    if (logDeleteError) {
      return NextResponse.json(
        { error: logDeleteError.message },
        { status: 500 }
      );
    }
  }

  // -------------------------------
  // 3️⃣ 스케줄 soft delete
  // -------------------------------
  const { error: scheduleSoftDelError } = await supabase
    .from("medicine_schedules")
    .update({
      deleted_at: new Date().toISOString(),
      is_notify: false,
    })
    .eq("medicine_id", Number(id))
    .eq("user_id", user.id);

  if (scheduleSoftDelError) {
    return NextResponse.json(
      { error: scheduleSoftDelError.message },
      { status: 500 }
    );
  }

  // -------------------------------
  // 4️⃣ 약 soft delete
  // -------------------------------
  const { error: medicineSoftDelError } = await supabase
    .from("medicines")
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", Number(id))
    .eq("user_id", user.id);

  if (medicineSoftDelError) {
    return NextResponse.json(
      { error: medicineSoftDelError.message },
      { status: 500 }
    );
  }

  // -------------------------------
  // 5️⃣ 완료
  // -------------------------------
  return NextResponse.json({ success: true });
}
