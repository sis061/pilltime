"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useState } from "react";
import NicknameDrawer from "../feature/profiles/NicknameDrawer";
import Image from "next/image";
import { User } from "@supabase/supabase-js";

export default function Header({ user }: { user: User | null }) {
  const router = useRouter();

  const clearUser = useUserStore((s) => s.clearUser);
  const [open, setOpen] = useState(false);

  async function getSupabase() {
    const { createClient } = await import("@/lib/supabase/client"); // ✅ 지연 로드
    return createClient();
  }

  async function logout() {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    clearUser();
    router.replace("/login");
  }

  return (
    <header className="h-20 bg-pilltime-blue/75 flex items-center justify-between !px-4 shadow-sm">
      <div>
        <Image
          src="/pilltime_logo.svg"
          alt="logo"
          width={60}
          height={60}
          className="-rotate-12"
        />
      </div>
      <div className="flex items-center gap-3 ">
        <Link href={`/medicines/new`} id="create_new_medicine">
          <Plus size={20} color="#fff" />
        </Link>
        {user && (
          <>
            {/* <span className="mr-4">{profile.nickname || profile.email}</span> */}
            <Button
              variant="ghost"
              onClick={() => setOpen(true)}
              className="!font-bold !p-2 cursor-pointer !text-white"
            >
              프로필 편집
            </Button>
            <NicknameDrawer open={open} onOpenChange={setOpen} mode="edit" />
          </>
        )}
        {user ? (
          <>
            {/* <span>{user.email}</span> */}
            <Button
              onClick={logout}
              className="!p-2 !font-bold cursor-pointer !text-white"
              variant={"ghost"}
            >
              로그아웃
            </Button>
          </>
        ) : (
          <Link href="/login">로그인</Link>
        )}
      </div>
    </header>
  );
}
