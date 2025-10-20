/**
 * 구독 저장 API
 * - 클라에서 pushManager.subscribe()로 받은 Subscription 객체를 그대로 전달
 * - 서버에서 user_id와 함께 DB(push_subscriptions)에 upsert
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { endpoint, keys } = body || {}; // VAPID 구독 필수 필드
  const p256dh = keys?.p256dh;
  const auth = keys?.auth;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (!endpoint || !p256dh || !auth)
    return new Response("Bad Request", { status: 400 });

  // endpoint를 unique로 upsert → 중복 저장 방지
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint, p256dh, auth },
      { onConflict: "endpoint" }
    );
  if (error) return new Response(error.message, { status: 500 });
  return new Response(null, { status: 201 });
}
