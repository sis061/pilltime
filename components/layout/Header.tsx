"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function Header({ user }: { user: any }) {
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="h-24 bg-blue-100 flex items-center justify-between px-4">
      <div>헤더</div>
      <div className="flex items-center gap-3">
        <Link href={`/medicines/new`}>
          <Plus size={20} />
        </Link>
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
