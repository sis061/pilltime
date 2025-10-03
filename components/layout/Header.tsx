"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useState } from "react";
import NicknameDrawer from "../feature/profiles/NicknameDrawer";

export default function Header({ user }: { user: any }) {
  const router = useRouter();
  const supabase = createClient();
  const profile = useUserStore((s) => s.user);
  const clearUser = useUserStore((s) => s.clearUser);
  const [open, setOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    clearUser();
    router.replace("/login");
  }

  return (
    <header className="h-24 bg-blue-100 flex items-center justify-between px-4">
      <div>헤더</div>
      <div className="flex items-center gap-3">
        <Link href={`/medicines/new`} id="create_new_medicine">
          <Plus size={20} />
        </Link>
        {profile && (
          <>
            {/* <span className="mr-4">{profile.nickname || profile.email}</span> */}
            <Button variant="ghost" onClick={() => setOpen(true)}>
              프로필 편집
            </Button>
            <NicknameDrawer open={open} onOpenChange={setOpen} mode="edit" />
          </>
        )}
        {user ? (
          <>
            {/* <span>{user.email}</span> */}
            <Button onClick={logout} className="!p-2" variant={"ghost"}>
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
