// TODO 빌드 전에 필요없는 라이브러리 삭제 필요

// ---- NEXT
import { redirect } from "next/navigation";
// ---- COMPONENT
// import HomeProfile from "@/components/feature/profiles/HomeProfile";
import MedicineList from "@/components/feature/medicines/MedicineList";
import HomeToday from "@/components/feature/calendars/HomeToday";
// ---- UTIL
import { createServerSupabaseClient } from "@/lib/supabase/server";
import FirstVisitBanner from "@/components/feature/notifications/FirstVisitBanner";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  // ✅ 로그인 유저 확인
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    redirect(`/login?next=${encodeURIComponent("/")}`);
  }

  const medicinesResult = await supabase
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
    .filter("medicine_schedules.deleted_at", "is", null)
    .order("time", { ascending: true, foreignTable: "medicine_schedules" });

  const medicines = !medicinesResult.error ? medicinesResult.data ?? [] : null;

  return (
    <section className="inner min-h-[calc(100dvh-11.5rem)] !text-pilltime-blue text-3xl !mx-auto !w-full h-full !mb-8 !p-2">
      <FirstVisitBanner />
      <div className="flex flex-col items-center gap-4 justify-center !-mb-2">
        <HomeToday />
      </div>

      {medicines ? (
        <MedicineList medicines={medicines} userId={user.id} />
      ) : (
        <MedicineListFallback />
      )}
    </section>
  );
}

function MedicineListFallback() {
  return (
    <div className="!p-4 !my-8 text-center">
      <h3 className="text-base !text-pilltime-grayDark/50 !pb-2 font-bold !mb-2">
        약 목록
      </h3>
      <p className="text-sm !text-pilltime-grayDark/50 !pb-2 font-bold ">
        약 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </p>
    </div>
  );
}
