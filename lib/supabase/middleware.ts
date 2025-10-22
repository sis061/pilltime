import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/login",
  "/callback",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { pathname, search } = req.nextUrl;

  // 퍼블릭 경로는 통과
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return res;

  // 세션 검사
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1) 비로그인 & 보호 경로 접근 → /login 으로 (원래 목적지 next 파라미터 유지)
  if (!user) {
    const redirectUrl = new URL("/login", req.url);
    const next = pathname + (search || "");
    redirectUrl.searchParams.set("next", next);
    return NextResponse.redirect(redirectUrl);
  }

  // 2) 로그인 상태에서 /login 접근 시 → 루트로 돌려보내기
  if (user && pathname.startsWith("/login")) {
    const to = req.nextUrl.searchParams.get("next") || "/";
    return NextResponse.redirect(new URL(to, req.url));
  }

  // 루트나 임의 경로에 ?code가 붙어서 오면, /callback으로 리다이렉트
  const url = new URL(req.url);
  if (url.searchParams.has("code")) {
    const to = new URL("/callback", url.origin);
    // state/next 등도 넘겨주고 싶다면 그대로 붙여줍니다.
    to.search = url.search;
    return NextResponse.redirect(to, 307);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
