import HeaderLogo from "./HeaderLogo";
import HeaderClient from "./HeaderClient";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { User } from "@/types/profile";
import { toYYYYMMDD } from "@/lib/date";

export default async function Header({ user }: { user: User }) {
  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();

  // ✅ 전역 알림 상태 (없으면 true로 간주)
  const { data: settings } = await supabase
    .from("user_notification_settings")
    .select("global_notify_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  const userMini: User = {
    id: user.id,
    email: user.email ?? null,
    nickname: profile?.nickname ?? null,
  };

  const initialGlobalEnabled = settings?.global_notify_enabled ?? true;
  const todayYmd = toYYYYMMDD(new Date());

  return (
    <header className="h-20 bg-pilltime-blue/75 flex items-center justify-between !px-4 shadow-sm">
      <div className="inner flex justify-between items-center !mx-auto h-full">
        <HeaderLogo />

        <HeaderClient
          user={userMini}
          initialGlobalEnabled={initialGlobalEnabled}
          todayYmd={todayYmd}
        />
      </div>
    </header>
  );
}
