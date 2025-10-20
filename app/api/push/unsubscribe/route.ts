/**
 * 구독 해제 API
 * - 클라에서 현재 구독의 endpoint를 보내면
 * - 서버 DB에서 해당 row 삭제 → 브라우저에서도 unsubscribe()
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { endpoint } = await req.json();
  if (!endpoint) return new Response("Bad Request", { status: 400 });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) return new Response(error.message, { status: 500 });
  return new Response(null, { status: 204 });
}
