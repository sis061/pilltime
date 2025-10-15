// app/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function resolveSafeRedirect(req: NextRequest) {
  const nextParam = req.nextUrl.searchParams.get("next") ?? "/";
  // 내부 경로만 허용 (오픈 리다이렉트 방지)
  const isInternal = nextParam.startsWith("/") && !nextParam.startsWith("//");
  const path = isInternal ? nextParam : "/";
  return new URL(path, req.nextUrl.origin);
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");

  // 기본 리다이렉트 목적지(안전한 내부 경로만)
  const redirectURL = resolveSafeRedirect(request);
  const res = NextResponse.redirect(redirectURL, 303);

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
        .maybeSingle();

      if (!profile) {
        await supabase
          .from("profiles")
          .insert({ id: user?.id, nickname: null });
      }
    }
  }

  return res;
}
