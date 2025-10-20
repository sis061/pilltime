import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const Body = z.object({ enabled: z.boolean() });

export async function GET() {
  const sb = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ enabled: true }, { status: 200 }); // 비로그인 상황이라면 기본 true

  const { data, error } = await sb
    .from("user_notification_settings")
    .select("global_notify_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ enabled: true }, { status: 200 }); // 테이블 row 없으면 true로 간주
  return NextResponse.json(
    { enabled: data?.global_notify_enabled ?? true },
    { status: 200 }
  );
}

export async function PATCH(req: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });

  const { enabled } = parsed.data;
  const { error } = await supabase.from("user_notification_settings").upsert({
    user_id: user.id,
    global_notify_enabled: enabled,
    updated_at: new Date().toISOString(),
  });
  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ enabled }, { status: 200 });
}
