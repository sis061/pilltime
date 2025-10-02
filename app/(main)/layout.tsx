"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/util/supabase";
import { useUserStore } from "@/store/useUserStore";

export default function MainLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const user = data.session.user;
        setUser({ id: user.id, email: user.email ?? undefined });
      } else {
        clearUser();
        router.replace("/login");
      }
    });

    // 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        const user = session.user;
        setUser({ id: user.id, email: user.email ?? undefined });
      }
      if (event === "SIGNED_OUT") {
        clearUser();
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, clearUser, router]);

  async function logout() {
    await supabase.auth.signOut();
    clearUser();
    router.replace("/login");
  }

  return (
    <div>
      <header className="h-24 bg-blue-100 flex items-center justify-between px-4">
        <div>헤더</div>
        <div className="flex items-center gap-3">
          <Link href={`/medicines/new`}>
            <Plus size={20} />
          </Link>
          <Button onClick={logout}>로그아웃</Button>
        </div>
      </header>

      <main className="wrapper">{children}</main>
      {modal}

      <footer className="h-24 bg-red-100">푸터</footer>
    </div>
  );
}
