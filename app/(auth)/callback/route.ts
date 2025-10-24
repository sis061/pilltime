import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

/** 내부 경로만 허용 */
function resolveSafeRedirect(req: NextRequest) {
  const nextParam = req.nextUrl.searchParams.get("next") ?? "/";
  const isInternal = nextParam.startsWith("/") && !nextParam.startsWith("//");
  return new URL(isInternal ? nextParam : "/", req.nextUrl.origin);
}

/** res(=Supabase가 쿠키를 기록한 응답)의 Set-Cookie를 to로 복사 */
function withSetCookie(from: NextResponse, to: NextResponse) {
  // 1) 표준 헤더에서 직접 복사 (여러 개면 콤마로 합쳐질 수 있음)
  const raw = from.headers.get("set-cookie");
  if (raw) {
    // 다중 Set-Cookie 안전 분리 (각 쿠키는 세미콜론들 포함, 쿠키 경계는 콤마이지만
    // 속성의 콤마와 구분하기 위해 정규식으로 분리)
    const parts = raw.split(/,(?=[^;]+?=)/g);
    for (const p of parts) to.headers.append("set-cookie", p.trim());
  }
  // 2) NextResponse.cookies API가 있는 경우(런타임에 따라)
  try {
    const cookies = (from as any).cookies?.getAll?.() ?? [];
    for (const c of cookies) {
      // 옵션까지 보존하려면 header 복사가 더 안전하므로 여기선 skip 또는 최소 세팅
      to.cookies.set(c.name, c.value);
    }
  } catch {}
  return to;
}

export async function GET(req: NextRequest) {
  const { supabase, res } = await createRouteSupabaseClient(req);

  const code = req.nextUrl.searchParams.get("code");
  const safeTarget = resolveSafeRedirect(req);

  // code 없으면: 그냥 목적지로 정리 이동(혹시 남아있을 code/state를 제거한 경로로 가고 싶으면 아래 clean 로직 재사용)
  if (!code) {
    return NextResponse.redirect(safeTarget, 303);
  }

  // 1) 세션 교환 (여기서 Supabase가 res에 Set-Cookie 기록)
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const to = NextResponse.redirect(
      new URL("/login?error=oauth", req.url),
      303
    );
    to.headers.set("Cache-Control", "no-store");
    return withSetCookie(res, to);
  }

  // 2) code/state가 제거된 "깨끗한" URL 만들기
  const clean = new URL(safeTarget); // ← 위에서 검증된 내부 경로만 사용
  clean.searchParams.delete("code");
  clean.searchParams.delete("state");
  clean.searchParams.delete("next"); // (선택) next도 주소창에서 제거하고 싶다면

  // 3) 최초 로그인 프로필 upsert (세션 교환 직후라 동일 supabase 인스턴스로 바로 가능)
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

  // 4) 쿠키를 가진 채로 깔끔한 URL로 리다이렉트
  const to = NextResponse.redirect(clean, 303);
  to.headers.set("Cache-Control", "no-store");
  return withSetCookie(res, to);
}
