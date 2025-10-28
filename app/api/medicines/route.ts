import { NextResponse, type NextRequest } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { revalidateMonthIndicator } from "@/lib/calendar/indicator";
import { sevenDayWindow } from "@/lib/date";

import { MedicineSchema } from "@/lib/schemas/medicine";
import type { TablesInsert } from "@/types_db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Route Handler 전용: req에서 읽고 res에 Set-Cookie 기록
    const { supabase, res } = await createRouteSupabaseClient(req);

    // 1) 로그인 유저 확인 (우선 인증 확인)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401, headers: res.headers } // 쿠키 전파
      );
    }

    // 2) 본문 파싱 + Zod 검증
    const body: unknown = await req.json();
    const parsed = MedicineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400, headers: res.headers } // 쿠키 전파
      );
    }

    const { name, description, imageUrl, schedules, repeated_pattern } =
      parsed.data;

    // 3) medicines insert
    const newMedicine: TablesInsert<"medicines"> = {
      user_id: user.id,
      name,
      description: description?.map((d) => String(d.value)) ?? [],
      image_url: typeof imageUrl === "string" ? imageUrl : "",
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
        { status: 500, headers: res.headers } // 쿠키 전파
      );
    }

    // 4) schedules insert (시간 중복 제거 + 정렬)
    const sortedSchedules = Array.from(
      new Map(
        [...schedules]
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((s) => [s.time, s])
      ).values()
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
        { status: 500, headers: res.headers } // 쿠키 전파
      );
    }

    // 5) 7일치 로그 생성 + 월별 캐시 무효화 수집
    const ymToInvalidate = new Set<string>();

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
        console.log(` ${insertedCount} logs generated for schedule ${s.id}`);
      }

      ymToInvalidate.add(fromStr.slice(0, 7)); // "YYYY-MM"
      ymToInvalidate.add(toStr.slice(0, 7));
    }

    // 6) 해당 월만 캐시 무효화
    for (const ym of ymToInvalidate) {
      await revalidateMonthIndicator(user.id, `${ym}-01`);
    }

    // 7) 성공 응답 (Location 헤더 포함) + Set-Cookie 전파
    const json = NextResponse.json(medicine, {
      status: 201,
      headers: res.headers, // 쿠키 전파
    });
    json.headers.set("Location", `/medicines/${medicine.id}`);
    return json;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "알 수 없는 오류" },
      { status: 500 } // 여긴 인증 쿠키 관여 X이므로 headers 생략 가능
    );
  }
}
