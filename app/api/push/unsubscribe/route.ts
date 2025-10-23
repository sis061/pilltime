/**
 * 구독 해제 API
 * - 클라에서 현재 구독의 endpoint를 보내면
 * - 서버 DB에서 해당 row 삭제 → 브라우저에서도 unsubscribe()
 */
// app/api/push/unsubscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const Body = z.object({
  endpoint: z.string().url(),
});

export async function POST(req: NextRequest) {
  const { supabase, res } = await createRouteSupabaseClient(req);

  // 세션 확인
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return new Response("Unauthorized", { status: 401, headers: res.headers });
  }

  // 바디 검증
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return new Response("Bad Request", { status: 400, headers: res.headers });
  }

  const { endpoint } = parsed.data;

  // DB에서 구독 삭제
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    return new Response(error.message, { status: 500, headers: res.headers });
  }

  // 204 No Content
  return new Response(null, { status: 204, headers: res.headers });
}

// (선택) 프리플라이트/CORS가 필요하면 추가
export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
