// app/components/layout/HeaderClient.tsx
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useEffect, useMemo, useState } from "react";
import NicknameDrawer from "../feature/profiles/NicknameDrawer";
import type { User } from "@supabase/supabase-js";
import { useGlobalLoading } from "@/store/useGlobalLoading";

export default function HeaderClient({
  user,
  nickname,
}: {
  user: User | null;
  nickname: string | null;
}) {
  const router = useRouter();
  const clearUser = useUserStore((s) => s.clearUser);
  const setUser = useUserStore((s) => s.setUser);
  const [open, setOpen] = useState(false);
  const setGLoading = useGlobalLoading((s) => s.setGLoading);

  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        email: user.email ?? null,
        nickname: nickname ?? null,
      });
    } else {
      clearUser();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, nickname]);

  async function getSupabase() {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  }

  async function logout() {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    clearUser();
    router.replace("/login");
  }

  const isLoggedIn = useMemo(() => !!user, [user]);

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/medicines/new"
        id="create_new_medicine"
        aria-label="새 약 등록"
        prefetch
        onClick={() => setGLoading(true, "정보를 불러오는 중이에요..")}
      >
        <Plus size={20} color="#fff" />
      </Link>

      {isLoggedIn && (
        <>
          <Button
            variant="ghost"
            onClick={() => setOpen(true)}
            className="font-bold cursor-pointer !text-white"
            aria-haspopup="dialog"
          >
            프로필 편집
          </Button>

          <NicknameDrawer open={open} onOpenChange={setOpen} mode="edit" />
        </>
      )}

      {isLoggedIn ? (
        <Button
          onClick={logout}
          className="font-bold cursor-pointer !text-white"
          variant="ghost"
        >
          로그아웃
        </Button>
      ) : (
        <Link href="/login" className="!text-white/90 hover:underline">
          로그인
        </Link>
      )}
    </div>
  );
}
