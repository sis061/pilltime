import Header from "@/components/layout/header/Header";
import Footer from "@/components/layout/Footer";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // 개인화 화면: SSR 강제
export const fetchCache = "default-no-store"; // 응답 캐시 비활성화

export default async function MainLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    redirect("/login");
    // 로그인 안 된 경우 로그인 페이지로 이동
  }

  return (
    <div>
      <Header user={{ id: user.id, email: user.email ?? null }} />
      <main className="wrapper">{children}</main>
      {modal}
      <Footer />
    </div>
  );
}
