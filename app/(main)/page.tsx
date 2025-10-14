// TODO 빌드 전에 필요없는 라이브러리 삭제 필요

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import HomeProfile from "@/components/feature/profiles/HomeProfile";
import MedicineList from "@/components/feature/medicines/MedicineList";

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  // ✅ 로그인 유저 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login"); // 로그인 안 된 경우 로그인 페이지로 이동
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .single();

  const { data: medicines, error } = await supabase
    .from("medicines")
    .select(
      `
      id,
      name,
      description,
      image_url,
      created_at,
      medicine_schedules (
        id,
        time,
        repeated_pattern,
        is_notify,
        intake_logs (
          id,
          date,
          time,
          status,
          checked_at
        )
      )
    `
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .filter("medicine_schedules.deleted_at", "is", null);

  if (error) {
    console.error("DB Error:", error.message);
    return <p>데이터 불러오기 실패</p>;
  }

  return (
    <section className="inner min-h-[calc(100dvh-11.5rem)] !text-pilltime-blue text-3xl !mx-auto !w-full h-full !mb-8 !p-2">
      <HomeProfile
        initialUser={{
          id: user.id,
          email: user.email,
          nickname: profile?.nickname ?? null,
        }}
      />
      <MedicineList initialMedicines={medicines} userId={user.id} />
    </section>
  );
}
