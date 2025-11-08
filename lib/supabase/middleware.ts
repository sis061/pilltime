import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/callback",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/sw.js",
  "/manifest.json",
  "/icon", // /icon-192.png 등
  "/apple-touch-icon", // iOS 아이콘
  "/api/auth/set",
];

export async function middleware(req: NextRequest) {
  // 이 응답 객체에 Supabase가 Set-Cookie를 기록하게 함
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        //  Next 15: req/res 기반 동기 접근 사용
        get(name: string) {
          return req.cookies.get(name)?.value ?? null;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  const { pathname } = req.nextUrl;

  // 퍼블릭 경로는 세션 검사 없이 통과
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") || // 정적 리소스
    pathname.startsWith("/images") // 정적 이미지 경로가 있다면
  ) {
    return res;
  }

  // 만료/리프레시 시 Set-Cookie가 res에 기록됨
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인 상태에서 /login 접근 → 원래 목적지(or /)로
  if (pathname.startsWith("/login")) {
    if (user) {
      const to = req.nextUrl.searchParams.get("next") || "/";
      const redirect = NextResponse.redirect(new URL(to, req.url), 303);
      redirect.headers.set("Cache-Control", "no-store");
      for (const [k, v] of res.headers) redirect.headers.set(k, v);
      return redirect;
    }
    // 비로그인: 로그인 페이지 그냥 통과
    return res;
  }

  // 비로그인 상태에서 보호 경로 접근 → /login?next=...
  // if (!user) {
  //   const redirectUrl = new URL("/login", req.url);
  //   const next = pathname + (search || "");
  //   redirectUrl.searchParams.set("next", next);
  //   const redirect = NextResponse.redirect(redirectUrl, 303);
  //   redirect.headers.set("Cache-Control", "no-store");
  //   for (const [k, v] of res.headers) redirect.headers.set(k, v);
  //   return redirect;
  // }

  // 통과
  return res;
}

// 정적 파일/이미지 등은 미들웨어 제외 (매처에서 1차 필터)
export const config = {
  matcher: [
    // _next, favicon 등 제외
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sw.js|manifest.json|icon|apple-touch-icon).*)",
  ],
};
