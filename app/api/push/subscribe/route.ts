/**
 * 구독 저장 API
 * - 클라에서 pushManager.subscribe()로 받은 Subscription 객체를 그대로 전달
 * - 서버에서 user_id와 함께 DB(push_subscriptions)에 upsert
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(), // 브라우저에 따라 null
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(req: NextRequest) {
  const { supabase, res } = await createRouteSupabaseClient(req);

  // 세션 확인 (쿠키 동기화됨)
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return new Response("Unauthorized", { status: 401, headers: res.headers });
  }

  // 페이로드 검증
  const json = await req.json().catch(() => ({}));
  const parsed = SubscriptionSchema.safeParse(json);
  if (!parsed.success) {
    return new Response("Bad Request", { status: 400, headers: res.headers });
  }

  const { endpoint, keys } = parsed.data;
  const { p256dh, auth } = keys;

  // endpoint unique upsert (DB에 unique index가 있어야 함)
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" } // UNIQUE (endpoint) 인덱스와 매칭
  );

  if (error) {
    return new Response(error.message, { status: 500, headers: res.headers });
  }

  // 201 Created
  return new Response(null, { status: 201, headers: res.headers });
}

// 필요하면 사전검증/프리플라이트 허용
export function OPTIONS(_req: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}
