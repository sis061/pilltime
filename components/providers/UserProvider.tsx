"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";

export function UserProvider({ children }: { children: React.ReactNode }) {
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
        .single();

      if (error) {
        console.log("프로필 불러오기 실패", error.message);
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        clearUser();
      }
      if (event === "SIGNED_IN" && session?.user) {
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
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, clearUser]);

  return <>{children}</>;
}
