import { createServerSupabaseClient } from "@/lib/supabase/server";

import Header from "@/components/layout/header/Header";
import Footer from "@/components/layout/Footer";

export const dynamic = "force-dynamic"; // ✅ 개인화 화면: SSR 강제
export const fetchCache = "default-no-store"; // ✅ 응답 캐시 비활성화

export default async function MainLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  let user = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user ?? null;
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user = null;
  }

  return (
    <div>
      <Header />
      <main className="wrapper">{children}</main>
      {modal}
      <Footer />
    </div>
  );
}
