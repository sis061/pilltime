import Image from "next/image";
import { redirect } from "next/navigation";
import HeaderClient from "./HeaderClient";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { User } from "@/types/profile";

export default async function Header() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    redirect("/login"); // 로그인 안 된 경우 로그인 페이지로 이동
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();

  const userMini: User = {
    id: user.id,
    email: user.email ?? null,
    nickname: profile?.nickname ?? null,
  };

  return (
    <header className="h-20 bg-pilltime-blue/75 flex items-center justify-between !px-4 shadow-sm">
      <div className="inner flex justify-between items-center !mx-auto h-full">
        <div>
          <Image
            src="/pilltime_logo.svg"
            alt="PillTime 로고"
            width={60}
            height={60}
            className="-rotate-12 "
            priority
          />
        </div>

        <HeaderClient user={userMini} />
      </div>
    </header>
  );
}
