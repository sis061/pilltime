"use client";

import { useEffect, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";

export default function RealtimeBridge({ userId }: { userId: string }) {
  const router = useRouter();
  const t = useRef<number | null>(null);

  const softRefresh = () => {
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => {
      startTransition(() => router.refresh());
    }, 100);
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const ch = supabase.channel("rt:pilltime-meds");

      const f = (table: string) =>
        ({
          event: "*",
          schema: "public",
          table,
          filter: `user_id=eq.${userId}`,
        } as const);

      ch.on("postgres_changes", f("intake_logs"), softRefresh);
      ch.on("postgres_changes", f("medicine_schedules"), softRefresh);
      ch.on("postgres_changes", f("medicines"), softRefresh);

      ch.subscribe();

      const onFocus = () => softRefresh();
      window.addEventListener("focus", onFocus);

      cleanup = () => {
        window.removeEventListener("focus", onFocus);
        if (t.current) window.clearTimeout(t.current);
        supabase.removeChannel(ch);
      };
    })();

    return () => cleanup?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return null;
}
