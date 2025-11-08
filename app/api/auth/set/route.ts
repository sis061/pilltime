// app/api/auth/set/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  const res = new NextResponse(null, { status: 204 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value ?? null,
        set: (name: string, value: string, options: CookieOptions) => {
          res.cookies.set(name, value, options);
        },
        remove: (name: string, options: CookieOptions) => {
          res.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  const { session } = await req.json().catch(() => ({ session: null }));

  if (session?.access_token && session?.refresh_token) {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } else {
    await supabase.auth.signOut(); // 로그아웃: 쿠키 제거
  }

  return res; // Set-Cookie 포함
}
