// app/api/medicines/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
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
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("time", { referencedTable: "medicine_schedules", ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await req.json();

    const { name, description, imageUrl, schedules, repeated_pattern } = body;

    // 1. 현재 로그인 유저 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. medicines 테이블에 먼저 insert
    const { data: medicine, error: medicineError } = await supabase
      .from("medicines")
      .insert([
        {
          user_id: user.id,
          name,
          description:
            description?.map((d: { value: string }) => d.value) ?? [],
          image_url: imageUrl ?? null,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (medicineError) {
      return NextResponse.json(
        { error: medicineError.message },
        { status: 500 }
      );
    }

    // 3. medicine_schedules 테이블에 insert
    if (schedules && schedules.length > 0) {
      const sortedSchedules = [...(body.schedules ?? [])].sort((a, b) =>
        a.time.localeCompare(b.time)
      );
      const { error: scheduleError } = await supabase
        .from("medicine_schedules")
        .insert(
          sortedSchedules.map((s: { time: string }) => ({
            user_id: user.id,
            medicine_id: medicine.id,
            time: s.time,
            repeated_pattern: repeated_pattern ?? { type: "DAILY" },
            is_notify: true,
          }))
        );

      if (scheduleError) {
        return NextResponse.json(
          { error: scheduleError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(medicine, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "알 수 없는 오류" },
      { status: 500 }
    );
  }
}
