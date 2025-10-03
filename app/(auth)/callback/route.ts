// app/callback/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  const res = NextResponse.redirect(new URL(next, request.url), 303);

  if (code) {
    const supabase = await createServerSupabaseClient(res);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("세션 교환 실패:", error.message);
      return NextResponse.redirect(new URL("/login", request.url), 303);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        await supabase
          .from("profiles")
          .insert({ id: user?.id, nickname: null });
      }
    }
  }

  return res;
}
