// lib/supabase/service.ts
// ❗️서버 전용. 클라이언트에서 import 금지
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) {
    throw new Error("Supabase service client env vars missing");
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        // 필요 시 여기에 서버 공통 헤더 추가 가능
      },
    },
  });
}
