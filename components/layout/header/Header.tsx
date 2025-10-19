import Image from "next/image";
import HeaderClient from "./HeaderClient";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Header() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nickname: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .maybeSingle();
    nickname = profile?.nickname ?? null;
  }

  return (
    <header className="h-20 bg-pilltime-blue/75 flex items-center justify-between !px-4 shadow-sm">
      <div className="inner flex justify-between !mx-auto">
        <div>
          <Image
            src="/pilltime_logo.svg"
            alt="PillTime 로고"
            width={60}
            height={60}
            className="-rotate-12"
            priority
          />
        </div>

        <HeaderClient user={user} nickname={nickname} />
      </div>
    </header>
  );
}
