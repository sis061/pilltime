// app/callback/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { createServerSupabaseClient } from "@/lib/supabase/server";

// function resolveSafeRedirect(req: NextRequest) {
//   const nextParam = req.nextUrl.searchParams.get("next") ?? "/";
//   // 내부 경로만 허용 (오픈 리다이렉트 방지)
//   const isInternal = nextParam.startsWith("/") && !nextParam.startsWith("//");
//   const path = isInternal ? nextParam : "/";
//   return new URL(path, req.nextUrl.origin);
// }

// export async function GET(request: NextRequest) {
//   const url = request.nextUrl;
//   const code = url.searchParams.get("code");

//   // 기본 리다이렉트 목적지(안전한 내부 경로만)
//   const redirectURL = resolveSafeRedirect(request);
//   const res = NextResponse.redirect(redirectURL, 303);

//   if (code) {
//     const supabase = await createServerSupabaseClient(res);
//     const { error } = await supabase.auth.exchangeCodeForSession(code);
//     if (error) {
//       console.error("세션 교환 실패:", error.message);
//       return NextResponse.redirect(new URL("/login", request.url), 303);
//     }

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (user) {
//       const { data: profile } = await supabase
//         .from("profiles")
//         .select("id")
//         .eq("id", user.id)
//         .maybeSingle();

//       if (!profile) {
//         await supabase
//           .from("profiles")
//           .insert({ id: user?.id, nickname: null });
//       }
//     }
//   }

//   return res;
// }

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function resolveSafeRedirect(req: NextRequest) {
  const nextParam = req.nextUrl.searchParams.get("next") ?? "/";
  const isInternal = nextParam.startsWith("/") && !nextParam.startsWith("//");
  return new URL(isInternal ? nextParam : "/", req.nextUrl.origin);
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");

  // 리다이렉트 응답을 먼저 생성 (여기에 쿠키를 써줄 것)
  const res = NextResponse.redirect(resolveSafeRedirect(request), 303);

  // ✅ 라우트 내부에서 Supabase 클라이언트 직접 생성 (쿠키 바인딩)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          // 쿠키를 리다이렉트 응답에 기록
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=oauth", url.origin),
        303
      );
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
        await supabase.from("profiles").insert({ id: user.id, nickname: null });
      }
    }
  }

  // ✅ Set-Cookie가 반영된 res로 종료 → 세션 유지 + ?code 제거
  return res;
}
