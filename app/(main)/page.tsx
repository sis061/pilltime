// TODO 빌드 전에 필요없는 라이브러리 삭제 필요

// ---- NEXT
import { redirect } from "next/navigation";
// ---- COMPONENT
import HomeProfile from "@/components/feature/profiles/HomeProfile";
import MedicineList from "@/components/feature/medicines/MedicineList";
import HomeToday from "@/components/feature/calendars/HomeToday";
// ---- UTIL
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    redirect("/login"); // 로그인 안 된 경우 로그인 페이지로 이동
  }

  const [profileSettled, medicinesSettled] = await Promise.allSettled([
    supabase.from("profiles").select("nickname").eq("id", user.id).single(),
    supabase
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
      .order("time", { ascending: true, foreignTable: "medicine_schedules" }),
  ]);

  const profile =
    profileSettled.status === "fulfilled" && !profileSettled.value.error
      ? profileSettled.value.data
      : null;

  const medicines =
    medicinesSettled.status === "fulfilled" && !medicinesSettled.value.error
      ? medicinesSettled.value.data ?? []
      : null;

  return (
    <section className="inner min-h-[calc(100dvh-11.5rem)] !text-pilltime-blue text-3xl !mx-auto !w-full h-full !mb-8 !p-2">
      <div className="!mb-12 flex flex-col items-center gap-4 justify-center max-md:!pt-4">
        <HomeToday />
        {profile ? (
          <HomeProfile
            initialUser={{
              id: user.id,
              email: user.email,
              nickname: profile?.nickname ?? null,
            }}
          />
        ) : (
          <ProfileFallback />
        )}
      </div>

      {medicines ? (
        <MedicineList medicines={medicines} userId={user.id} />
      ) : (
        <MedicineListFallback />
      )}
    </section>
  );
}

function ProfileFallback() {
  return (
    <div className="!p-4 !my-8 text-center">
      <p className="text-sm !text-pilltime-grayDark/50 !pb-2 font-bold ">
        프로필 정보를 불러오지 못했습니다. 새로고침을 시도해보세요.
      </p>
    </div>
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
