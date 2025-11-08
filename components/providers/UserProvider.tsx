"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import { usePush } from "@/hooks/usePush";

async function syncServerCookie(session: any) {
  try {
    await fetch("/api/auth/set", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session }),
    });
  } catch {}
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const { subscribe } = usePush(vapid);

  const supabase = createClient();
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  // 앱 복귀 시 세션 재확인
  // useEffect(() => {
  //   const supabase = createClient();
  //   const onVisible = async () => {
  //     if (document.visibilityState !== "visible") return;
  //     await supabase.auth.getSession();
  //   };
  //   document.addEventListener("visibilitychange", onVisible);
  //   return () => document.removeEventListener("visibilitychange", onVisible);
  // }, []);

  useEffect(() => {
    (async () => {
      // ✅ 앱 첫 로드 시: 세션 확인 + 서버 쿠키 동기화
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await syncServerCookie(session);

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
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ✅ 세션 변화마다 서버 쿠키 동기화
      await syncServerCookie(session);

      if (event === "SIGNED_IN" && session?.user) {
        try {
          await subscribe(); // 푸시 구독은 로그인 확정 후
        } catch (err) {
          console.error("[Push Subscribe after SIGNED_IN]", err);
        }
        const current = useUserStore.getState().user;
        if (current && current.id === session.user.id && current.nickname)
          return;
        setUser({
          id: session.user.id,
          email: session.user.email ?? undefined,
          nickname: "",
        });
      }

      if (event === "SIGNED_OUT") {
        clearUser();
      }
    });

    // (선택) 앱 복귀 시 세션/쿠키 재동기화 — iOS WebView 새로 열렸을 때 대비
    const onVis = async () => {
      if (document.visibilityState !== "visible") return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await syncServerCookie(session);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [supabase, subscribe, setUser, clearUser]);

  return <>{children}</>;
}
