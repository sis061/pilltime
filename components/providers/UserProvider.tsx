"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import { usePush } from "@/hooks/usePush";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const { subscribe } = usePush(vapid);

  const supabase = createClient();
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        clearUser();
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.log("프로필 불러오기 실패", error.message);
        toast.error("프로필을 불러오는 중 문제가 발생했어요");
        return;
      }

      setUser({
        id: user.id,
        email: user.email ?? undefined,
        nickname: profile?.nickname ?? null,
      });
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        //  세션이 확정된 뒤에만 구독 시도
        try {
          await subscribe();
        } catch (err) {
          console.error("[Push Subscribe after SIGNED_IN]", err);
        }
        // 이미 로그인된 동일 유저라면 store 덮어쓰지 않음
        const current = useUserStore.getState().user;
        if (current && current.id === session.user.id && current.nickname)
          return;
        setUser({
          id: session.user.id,
          email: session.user.email ?? undefined,
          nickname: "", // 최초엔 빈 값, 이후 fetch 필요
        });
      }
      if (event === "SIGNED_OUT") {
        clearUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, subscribe, setUser, clearUser]);

  return <>{children}</>;
}
