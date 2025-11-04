import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../../types_db";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // PWA에서 세션 유지
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // 고정 스토리지 키: 기기/설치 간 일관성 ↑
        storageKey: "pilltime.auth",
      },
    }
  );
}
