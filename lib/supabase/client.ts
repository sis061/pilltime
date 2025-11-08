// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types_db";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;
let _timer: ReturnType<typeof setTimeout> | null = null;

/** onAuthStateChange에서 서버로 전달할 이벤트만 좁혀서 허용 */
const FORWARD_EVENTS = [
  "SIGNED_IN",
  "SIGNED_OUT",
  "TOKEN_REFRESHED",
  "USER_UPDATED",
] as const satisfies readonly AuthChangeEvent[];

export function createClient() {
  if (_client) return _client;

  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  _client.auth.onAuthStateChange(
    (event: AuthChangeEvent, session: Session | null) => {
      // 타입 안전한 이벤트 필터 (TOKEN_REFRESH_FAILED 등 미정의 이벤트 제외)
      if (!(FORWARD_EVENTS as readonly AuthChangeEvent[]).includes(event))
        return;

      // 디바운스: 잦은 갱신을 1회로 합침
      if (_timer) clearTimeout(_timer);
      _timer = setTimeout(() => {
        // 서버 쿠키에 세션을 미러링 (멱등)
        fetch("/callback", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, session }),
        }).catch(() => {
          /* 네트워크 에러 무시 (다음 트리거에서 복구) */
        });
      }, 300);
    }
  );

  return _client;
}
