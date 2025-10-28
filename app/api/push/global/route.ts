import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const Body = z.object({ enabled: z.boolean() });

export async function GET(req: NextRequest) {
  const { supabase, res } = await createRouteSupabaseClient(req);

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  // 비로그인/세션 없음 → 기본 true
  if (authErr || !user) {
    return NextResponse.json(
      { enabled: true },
      { status: 200, headers: res.headers }
    );
  }

  const { data, error } = await supabase
    .from("user_notification_settings")
    .select("global_notify_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  // 행이 없거나 오류면 기본 true
  if (error) {
    return NextResponse.json(
      { enabled: true },
      { status: 200, headers: res.headers }
    );
  }

  return NextResponse.json(
    { enabled: data?.global_notify_enabled ?? true },
    { status: 200, headers: res.headers }
  );
}

export async function PATCH(req: NextRequest) {
  const { supabase, res } = await createRouteSupabaseClient(req);

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

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Bad Request" },
      { status: 400, headers: res.headers }
    );
  }

  const { enabled } = parsed.data;

  const { error } = await supabase.from("user_notification_settings").upsert({
    user_id: user.id,
    global_notify_enabled: enabled,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500, headers: res.headers }
    );
  }

  return NextResponse.json({ enabled }, { status: 200, headers: res.headers });
}
