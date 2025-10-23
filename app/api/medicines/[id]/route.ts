// app/api/medicines/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { revalidateMonthIndicator } from "@/lib/calendar/indicator";
import { toHHMMSS, toYYYYMMDD } from "@/lib/date";

export const runtime = "nodejs";

/* -----------
 * GET
 * ----------- */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, res } = await createRouteSupabaseClient(req);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: res.headers }
    );
  }

  const idNum = Number(id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400, headers: res.headers }
    );
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
    .eq("id", idNum)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .filter("medicine_schedules.deleted_at", "is", null)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: res.headers }
    );
  }

  return NextResponse.json(data, { headers: res.headers });
}

/* -----------
 * PUT
 * ----------- */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, res } = await createRouteSupabaseClient(req);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: res.headers }
    );
  }

  const idNum = Number(id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400, headers: res.headers }
    );
  }

  const body = await req.json();

  // 무효화할 월(YYYY-MM) 수집
  const ymToInvalidate = new Set<string>();
  const today = new Date();
  const next7 = new Date(today);
  next7.setDate(today.getDate() + 7);
  const todayYmd = today.toISOString().slice(0, 10);
  const next7Ymd = next7.toISOString().slice(0, 10);
  ymToInvalidate.add(todayYmd.slice(0, 7));
  ymToInvalidate.add(next7Ymd.slice(0, 7));

  // 1) 약 정보 업데이트 (dirty만)
  const medPatch: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (body.name !== undefined) medPatch.name = body.name;
  if (body.description !== undefined) {
    medPatch.description =
      body.description?.map((d: { value: string }) => d.value) ?? [];
  }
  if (body.imageUrl !== undefined) medPatch.image_url = body.imageUrl ?? null;

  if (Object.keys(medPatch).length > 1) {
    const { error: medError } = await supabase
      .from("medicines")
      .update(medPatch)
      .eq("id", idNum)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (medError) {
      return NextResponse.json(
        { error: medError.message },
        { status: 500, headers: res.headers }
      );
    }

    // 이름 변경 시 현재/다음 월 무효화
    if (body.name !== undefined) {
      ymToInvalidate.add(todayYmd.slice(0, 7));
      ymToInvalidate.add(next7Ymd.slice(0, 7));
    }
  }

  // 2) 스케줄 diff 적용
  const { schedules_changed, schedules_patch, repeated_pattern } = body ?? {};
  if (schedules_changed && schedules_patch) {
    const baseRP = {
      tz: repeated_pattern?.tz ?? "Asia/Seoul",
      type: repeated_pattern?.type ?? "DAILY",
      days_of_week: repeated_pattern?.days_of_week ?? [],
      days_of_month: repeated_pattern?.days_of_month ?? [],
    };

    const now = new Date();
    const fromStr = now.toISOString().slice(0, 10);
    const to = new Date(now);
    to.setDate(now.getDate() + 7);
    const toStr = to.toISOString().slice(0, 10);

    ymToInvalidate.add(fromStr.slice(0, 7));
    ymToInvalidate.add(toStr.slice(0, 7));

    // INSERT
    if (
      Array.isArray(schedules_patch.insert) &&
      schedules_patch.insert.length
    ) {
      const insertRows = schedules_patch.insert.map((s: any) => ({
        user_id: user.id,
        medicine_id: idNum,
        time: toHHMMSS(s.time),
        repeated_pattern: s.repeated_pattern ?? baseRP,
        is_notify: true,
      }));

      const { data: inserted, error } = await supabase
        .from("medicine_schedules")
        .insert(insertRows)
        .select("id");

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500, headers: res.headers }
        );
      }

      for (const row of inserted ?? []) {
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

    // UPDATE
    if (
      Array.isArray(schedules_patch.update) &&
      schedules_patch.update.length
    ) {
      for (const u of schedules_patch.update) {
        const patch: Record<string, any> = {};
        if (u.time !== undefined) patch.time = toHHMMSS(u.time);
        if (u.repeated_pattern !== undefined)
          patch.repeated_pattern = u.repeated_pattern;

        if (Object.keys(patch).length) {
          const { error } = await supabase
            .from("medicine_schedules")
            .update({ ...patch, updated_at: new Date().toISOString() })
            .eq("id", u.id)
            .eq("medicine_id", idNum)
            .eq("user_id", user.id)
            .is("deleted_at", null);

          if (error) {
            return NextResponse.json(
              { error: error.message },
              { status: 500, headers: res.headers }
            );
          }
        }

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

    // DELETE
    if (
      Array.isArray(schedules_patch.delete) &&
      schedules_patch.delete.length
    ) {
      const delIds: number[] = schedules_patch.delete;

      for (const sid of delIds) {
        const { error: resetErr } = await supabase.rpc(
          "reset_future_logs_for_schedule",
          {
            p_schedule_id: sid,
          }
        );
        if (resetErr) {
          return NextResponse.json(
            { error: resetErr.message },
            { status: 500, headers: res.headers }
          );
        }
      }

      const { error: softErr } = await supabase
        .from("medicine_schedules")
        .update({ deleted_at: new Date().toISOString(), is_notify: false })
        .in("id", delIds)
        .eq("medicine_id", idNum)
        .eq("user_id", user.id)
        .is("deleted_at", null);

      if (softErr) {
        return NextResponse.json(
          { error: softErr.message },
          { status: 500, headers: res.headers }
        );
      }

      const base = new Date();
      ymToInvalidate.add(base.toISOString().slice(0, 7));
      const plus7 = new Date(base);
      plus7.setDate(base.getDate() + 7);
      ymToInvalidate.add(plus7.toISOString().slice(0, 7));
    }
  }

  // 3) 월 캐시 무효화
  for (const ym of ymToInvalidate) {
    await revalidateMonthIndicator(user.id, `${ym}-01`);
  }

  return NextResponse.json({ success: true }, { headers: res.headers });
}

/* -----------
 * DELETE
 * ----------- */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, res } = await createRouteSupabaseClient(req);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: res.headers }
    );
  }

  const idNum = Number(id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400, headers: res.headers }
    );
  }

  // 1) 스케줄 ID 목록
  const { data: schedules, error: scheduleError } = await supabase
    .from("medicine_schedules")
    .select("id")
    .eq("medicine_id", idNum)
    .eq("user_id", user.id);

  if (scheduleError) {
    return NextResponse.json(
      { error: scheduleError.message },
      { status: 500, headers: res.headers }
    );
  }
  const scheduleIds = schedules?.map((s) => s.id) ?? [];

  // 2) 미래 로그 삭제
  if (scheduleIds.length > 0) {
    const today = toYYYYMMDD(new Date(), "Asia/Seoul");
    const { error: logDeleteError } = await supabase
      .from("intake_logs")
      .delete()
      .in("schedule_id", scheduleIds)
      .gte("date", today);

    if (logDeleteError) {
      return NextResponse.json(
        { error: logDeleteError.message },
        { status: 500, headers: res.headers }
      );
    }
  }

  // 3) 스케줄 soft delete
  const { error: scheduleSoftDelError } = await supabase
    .from("medicine_schedules")
    .update({ deleted_at: new Date().toISOString(), is_notify: false })
    .eq("medicine_id", idNum)
    .eq("user_id", user.id);

  if (scheduleSoftDelError) {
    return NextResponse.json(
      { error: scheduleSoftDelError.message },
      { status: 500, headers: res.headers }
    );
  }

  // 4) 약 soft delete
  const { error: medicineSoftDelError } = await supabase
    .from("medicines")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", idNum)
    .eq("user_id", user.id);

  if (medicineSoftDelError) {
    return NextResponse.json(
      { error: medicineSoftDelError.message },
      { status: 500, headers: res.headers }
    );
  }

  // 5) 월 캐시 무효화 (오늘/다음주)
  const base = new Date();
  const ym1 = base.toISOString().slice(0, 7);
  const base2 = new Date(base);
  base2.setDate(base.getDate() + 7);
  const ym2 = base2.toISOString().slice(0, 7);

  await revalidateMonthIndicator(user.id, `${ym1}-01`);
  await revalidateMonthIndicator(user.id, `${ym2}-01`);

  return NextResponse.json({ success: true }, { headers: res.headers });
}
