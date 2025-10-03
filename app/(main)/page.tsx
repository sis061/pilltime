import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import MedicineCard from "@/components/feature/medicines/MedicineCard";

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  // ✅ 로그인 유저 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login"); // 로그인 안 된 경우 로그인 페이지로 이동
  }

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
      <div>
        <h1>안녕하세요, {user.email} 님</h1>
      </div>
      <div>
        {new Date().getMonth() + 1}월 {new Date().getDate()}일{" "}
        {new Date().toLocaleDateString("ko-KR", { weekday: "long" })}
      </div>

      {medicines?.map((m) => (
        <MedicineCard
          key={m.id.toString()}
          id={m.id.toString()}
          name={m.name}
          imageUrl={m.image_url ?? ""}
          description={m.description ?? []}
          schedules={m.medicine_schedules ?? []}
        />
      ))}
    </section>
  );
}
