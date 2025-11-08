import { NextResponse, type NextRequest } from "next/server";

const BYPASS_PATHS = [
  "/_next/", // 빌드 자산
  "/api/", // 내부 API
  "/sw.js",
  "/manifest.json",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/icon", // /icon-192.png 등
  "/apple-touch-icon", // iOS 아이콘
  "/callback", // OAuth 콜백
];

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const host = req.headers.get("host") || "";
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const mainHost = new URL(site).host;

  // 1) 빌드/정적/콜백/내부API는 미들웨어 간섭 금지
  if (BYPASS_PATHS.some((p) => url.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2) code 파라미터가 달린 네비게이션은 간섭 금지 (루프 방지)
  if (url.searchParams.has("code")) {
    return NextResponse.next();
  }

  // 3) 프리뷰/브랜치/기타 호스트 → 메인 호스트로 301
  if (host !== mainHost) {
    const to = `${site}${url.pathname}${url.search}`;
    return NextResponse.redirect(to, 301);
  }

  // 4) 기본 통과
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
