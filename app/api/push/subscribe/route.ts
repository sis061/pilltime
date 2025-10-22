/**
 * 구독 저장 API
 * - 클라에서 pushManager.subscribe()로 받은 Subscription 객체를 그대로 전달
 * - 서버에서 user_id와 함께 DB(push_subscriptions)에 upsert
 */
// import { createServerSupabaseClient } from "@/lib/supabase/server";

// export async function POST(req: Request) {
//   const body = await req.json();
//   const { endpoint, keys } = body || {}; // VAPID 구독 필수 필드
//   const p256dh = keys?.p256dh;
//   const auth = keys?.auth;

//   const supabase = await createServerSupabaseClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();
//   if (!user) return new Response("Unauthorized", { status: 401 });

//   if (!endpoint || !p256dh || !auth)
//     return new Response("Bad Request", { status: 400 });

//   // endpoint를 unique로 upsert → 중복 저장 방지
//   const { error } = await supabase
//     .from("push_subscriptions")
//     .upsert(
//       { user_id: user.id, endpoint, p256dh, auth },
//       { onConflict: "endpoint" }
//     );
//   if (error) return new Response(error.message, { status: 500 });
//   return new Response(null, { status: 201 });
// }

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubBody = { endpoint?: string; p256dh?: string; auth?: string };

function err(status: number, msg: string) {
  return new NextResponse(msg, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  // 1️⃣ 바디 파싱
  let body: SubBody | null = null;
  try {
    body = (await req.json()) as SubBody;
  } catch (e: any) {
    return err(400, `invalid json: ${String(e?.message || e)}`);
  }

  if (!body?.endpoint || !body?.p256dh || !body?.auth) {
    return err(
      400,
      `missing fields: endpoint=${!!body?.endpoint}, p256dh=${!!body?.p256dh}, auth=${!!body?.auth}`
    );
  }

  // 2️⃣ 쿠키 store
}
