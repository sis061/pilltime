// app/api/medicines/[id]/route.ts

//TODO supabase 리얼타임 구현, 다른 라우트에도

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

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

  // 약 정보 수정
  const { error: updateError } = await supabase
    .from("medicines")
    .update({
      name: body.name,
      description:
        body.description?.map((d: { value: string }) => d.value) ?? [],
      image_url: body.imageUrl,
    })
    .eq("id", Number(id))
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 스케줄 초기화 후 다시 insert (단순화)
  if (body.schedules) {
    await supabase
      .from("medicine_schedules")
      .delete()
      .eq("medicine_id", Number(id));

    const sortedSchedules = [...body.schedules].sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    const { error: schedulesError } = await supabase
      .from("medicine_schedules")
      .insert(
        sortedSchedules.map((s: { time: string }) => ({
          user_id: String(user.id),
          medicine_id: Number(id),
          time: s.time,
          repeated_pattern: body.repeated_pattern ?? { type: "DAILY" },
          is_notify: true,
        }))
      );

    if (schedulesError) {
      return NextResponse.json(
        { error: schedulesError.message },
        { status: 500 }
      );
    }
  }

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

  // soft delete → deleted_at 업데이트
  const { error } = await supabase
    .from("medicines")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", Number(id))
    .eq("user_id", user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
