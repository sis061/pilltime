// TODO 빌드 전에 필요없는 라이브러리 삭제 필요
// TODO 아무 약도 없는 경우에 렌더할 페이지 필요
// TODO 리얼타임 구현 데이터 추가 삭제 변경 될 시 바로 반영되게

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/utils/supabase/server";
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
    .order("created_at", { ascending: false });

  if (error) {
    console.error("DB Error:", error.message);
    return <p>데이터 불러오기 실패</p>;
  }

  return (
    <section className="inner !text-pilltime-blue text-3xl !mx-auto !w-full h-full !mt-12 !p-2">
      <HomeProfile
        initialUser={{
          id: user.id,
          email: user.email,
          nickname: profile?.nickname ?? null,
        }}
      />
      <MedicineList medicines={medicines} />
    </section>
  );
}
