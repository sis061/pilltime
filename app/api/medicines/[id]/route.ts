import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import type { Database } from "@/types_db";
type Tables = Database["public"]["Tables"];

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // -------------------------------
  // 1️⃣ 약 정보 업데이트
  // -------------------------------
  const { error: medError } = await supabase
    .from("medicines")
    .update({
      name: body.name,
      description:
        body.description?.map((d: { value: string }) => d.value) ?? [],
      image_url: body.imageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", Number(id))
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (medError)
    return NextResponse.json({ error: medError.message }, { status: 500 });

  // -------------------------------
  // 2️⃣ 기존 스케줄 ID 조회
  // -------------------------------
  const { data: existingSchedules, error: schedulesSelectError } =
    await supabase
      .from("medicine_schedules")
      .select("id")
      .eq("medicine_id", Number(id))
      .eq("user_id", user.id);

  if (schedulesSelectError) {
    return NextResponse.json(
      { error: schedulesSelectError.message },
      { status: 500 }
    );
  }

  const existingIds = existingSchedules?.map((s) => s.id) ?? [];

  // -------------------------------
  // 3️⃣ 기존 로그 중 미래 로그만 삭제 (과거 기록 보존)
  // -------------------------------
  if (existingIds.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const { error: deleteLogsError } = await supabase
      .from("intake_logs")
      .delete()
      .in("schedule_id", existingIds)
      .gte("date", today);

    if (deleteLogsError) {
      return NextResponse.json(
        { error: deleteLogsError.message },
        { status: 500 }
      );
    }
  }

  // -------------------------------
  // 4️⃣ 기존 스케줄 전체 삭제
  // -------------------------------
  const { error: deleteSchedulesError } = await supabase
    // .from("medicine_schedules")
    // .delete()
    // .eq("medicine_id", Number(id))
    // .eq("user_id", user.id);
    .from("medicine_schedules")
    .update({
      deleted_at: new Date().toISOString(),
      is_notify: false,
    })
    .eq("medicine_id", Number(id))
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (deleteSchedulesError) {
    return NextResponse.json(
      { error: deleteSchedulesError.message },
      { status: 500 }
    );
  }

  // -------------------------------
  // 5️⃣ 새 스케줄 insert
  // -------------------------------
  const sortedSchedules = [...body.schedules].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  const { data: newSchedules, error: schedulesInsertError } = await supabase
    .from("medicine_schedules")
    .insert(
      sortedSchedules.map((s: { time: string }) => ({
        user_id: user.id,
        medicine_id: Number(id),
        time: s.time,
        repeated_pattern: body.repeated_pattern ?? { type: "DAILY" },
        is_notify: true,
      }))
    )
    .select("id");

  if (schedulesInsertError) {
    return NextResponse.json(
      { error: schedulesInsertError.message },
      { status: 500 }
    );
  }

  // -------------------------------
  // 6️⃣ 새 스케줄 기준으로 7일치 로그 재생성
  // -------------------------------
  const now = new Date();
  const from = now.toISOString().split("T")[0];
  const to = new Date();
  to.setDate(now.getDate() + 7);
  const toStr = to.toISOString().split("T")[0];

  for (const s of newSchedules ?? []) {
    const { error } = await supabase.rpc("generate_logs_for_schedule", {
      p_schedule_id: s.id,
      p_from_date: from,
      p_to_date: toStr,
    });

    if (error) {
      console.error(`로그 생성 실패 (schedule_id=${s.id}):`, error.message);
    }
  }

  // -------------------------------
  // 7️⃣ 완료 응답
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
  } = await supabase.auth.getUser();

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
