// app/api/medicines/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types_db";
import { MedicineSchema } from "@/lib/schemas/medicine";
import { sevenDayWindow } from "@/lib/date";

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body: unknown = await req.json();

    // ✅ Zod 검증
    const parsed = MedicineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, description, imageUrl, schedules, repeated_pattern } =
      parsed.data;

    // 1️⃣ 로그인 유저 확인
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

    // 2️⃣ medicines insert (Supabase 타입 사용)
    const newMedicine: TablesInsert<"medicines"> = {
      user_id: user.id,
      name,
      description: description?.map((d) => String(d.value)) ?? [],
      image_url: imageUrl ?? null,
      is_active: true,
    };

    const { data: medicine, error: medicineError } = await supabase
      .from("medicines")
      .insert([newMedicine])
      .select("id, created_at")
      .single();

    if (medicineError || !medicine) {
      return NextResponse.json(
        { error: medicineError?.message ?? "medicine 생성 실패" },
        { status: 500 }
      );
    }

    // 3️⃣ schedules insert
    const sortedSchedules = schedules.sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    const scheduleInserts: TablesInsert<"medicine_schedules">[] =
      sortedSchedules.map((s) => ({
        user_id: user.id,
        medicine_id: medicine.id,
        time: s.time,
        repeated_pattern: {
          type: repeated_pattern.type,
          days_of_week: repeated_pattern.days_of_week ?? [],
          days_of_month: repeated_pattern.days_of_month ?? [],
          tz: "Asia/Seoul",
        },
        is_notify: true,
      }));

    const { data: scheduleRows, error: scheduleError } = await supabase
      .from("medicine_schedules")
      .insert(scheduleInserts)
      .select("id, time, repeated_pattern, is_notify");

    if (scheduleError || !scheduleRows) {
      return NextResponse.json(
        { error: scheduleError?.message ?? "스케줄 생성 실패" },
        { status: 500 }
      );
    }

    // 4️⃣ 7일치 로그 생성 (Supabase RPC)
    for (const s of scheduleRows) {
      const repeated = s.repeated_pattern as Record<string, any>;
      const tz = repeated?.tz ?? "Asia/Seoul";
      const { fromStr, toStr } = sevenDayWindow(tz);

      await supabase.rpc("reset_future_logs_for_schedule", {
        p_schedule_id: s.id,
      });

      const { data: insertedCount, error: genErr } = await supabase.rpc(
        "generate_logs_for_schedule",
        {
          p_schedule_id: s.id,
          p_from_date: fromStr,
          p_to_date: toStr,
        }
      );

      if (genErr) {
        console.error("❌ RPC error:", genErr.message);
      } else {
        console.log(`✅ ${insertedCount} logs generated for schedule ${s.id}`);
      }
    }

    return NextResponse.json(medicine, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "알 수 없는 오류" },
      { status: 500 }
    );
  }
}
