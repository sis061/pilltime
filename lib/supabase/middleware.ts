import { NextResponse, type NextRequest } from "next/server";

const BYPASS_PATHS = [
  "/_next/", // 빌드 자산
  "/api/", // 내부 API
  "/sw.js",
  "/manifest.json",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/.well-known/", // Apple/웹 인증 파일들
  "/icon", // /icon-192.png 등
  "/apple-touch-icon", // iOS 아이콘
  // ❌ "/callback" 은 여기서 제외 (정규화 대상)
];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const site = process.env.NEXT_PUBLIC_SITE_URL;

  // 환경이 미설정이면 패스
  if (!site) return NextResponse.next();

  const mainUrl = new URL(site);
  const currentHost = url.host; // ex) preview-xxxxx.vercel.app
  const mainHost = mainUrl.host; // ex) pilltime.app

  // 0) 정적/내부 경로는 미들웨어 간섭 금지
  if (BYPASS_PATHS.some((p) => url.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 1) 호스트 정규화는 가장 먼저 (✅ /callback 포함)
  if (currentHost !== mainHost) {
    // 쿼리 그대로 보존 (code/state 포함)
    const to = `${site}${url.pathname}${url.search}`;
    // 308(영구) 사용: 메소드/바디 보존. GET도 문제없고, 추후 POST에도 안전.
    return NextResponse.redirect(to, 308);
  }

  // 2) 여기부터는 이미 메인 호스트.
  //    code 파라미터가 달린 네비게이션은 간섭 금지 (루프 방지)
  if (url.searchParams.has("code")) {
    return NextResponse.next();
  }

  // 3) 기본 통과
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
