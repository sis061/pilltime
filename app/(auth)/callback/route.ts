// app/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

function resolveSafeRedirect(req: NextRequest) {
  const nextParam = req.nextUrl.searchParams.get("next") ?? "/";
  const isInternal = nextParam.startsWith("/") && !nextParam.startsWith("//");
  return new URL(isInternal ? nextParam : "/", req.nextUrl.origin);
}

// res(NextResponse.next())에 기록된 Set-Cookie들을 새 redirect 응답으로 복사
function withSetCookie(from: NextResponse, to: NextResponse) {
  const setCookies = from.headers.getSetCookie?.() ?? [];
  for (const v of setCookies) to.headers.append("set-cookie", v);
  return to;
}

export async function GET(req: NextRequest) {
  const { supabase, res } = await createRouteSupabaseClient(req);
  const code = req.nextUrl.searchParams.get("code");
  const target = resolveSafeRedirect(req);

  // code 없으면 그냥 target으로
  if (!code) {
    return NextResponse.redirect(target, 303);
  }

  // 세션 교환 (여기서 Set-Cookie가 res에 기록됨)
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const to = NextResponse.redirect(
      new URL("/login?error=oauth", req.url),
      303
    );
    return withSetCookie(res, to);
  }

  // (선택) 최초 로그인 사용자 profiles upsert
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
      await supabase.from("profiles").insert({ id: user.id, nickname: null });
    }
  }

  // 정상 완료: target으로 303, Set-Cookie 전달
  const to = NextResponse.redirect(target, 303);
  return withSetCookie(res, to);
}
