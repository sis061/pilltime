"use client";

import { MedicineDetail } from "@/app/types/medicines";
import MedicineCard from "@/components/feature/medicines/MedicineCard";
import EmptyMedicine from "./EmptyMedicine";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useRef, useState } from "react";
import { mapToCardModel, sortMedicinesByToday } from "@/utils/medicine";

async function fetchMedicines(supabase: any, userId: string) {
  const { data, error } = await supabase
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
        intake_logs (
          id,
          date,
          status
        )
      )
    `
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .filter("medicine_schedules.deleted_at", "is", null);

  if (error) throw error;
  return data as MedicineDetail[];
}

export default function MedicineList({
  initialMedicines,
  userId,
}: {
  initialMedicines: any[];
  userId: string;
}) {
  const supabase = createClient();
  const [medicines, setMedicines] = useState<MedicineDetail[]>(
    initialMedicines ?? []
  );
  const refetchTimer = useRef<number | null>(null);

  /** ✅ refetch (이벤트 당 1회만 실행되도록 디바운스) */
  const scheduleRefetch = () => {
    if (refetchTimer.current) window.clearTimeout(refetchTimer.current);
    refetchTimer.current = window.setTimeout(async () => {
      try {
        const data = await fetchMedicines(supabase, userId);
        setMedicines(data);
      } catch (err) {
        console.error("Refetch failed:", err);
      }
    }, 300);
  };

  useEffect(() => {
    if (!userId) return;

    const ch = supabase.channel("rt:pilltime-meds");

    // ✅ intake_logs (크론/자정 MISSED 반영)
    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "intake_logs",
        filter: `user_id=eq.${userId}`,
      },
      scheduleRefetch
    );

    // ✅ 스케줄 변경
    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "medicine_schedules",
        filter: `user_id=eq.${userId}`,
      },
      scheduleRefetch
    );

    // ✅ 약 CRUD
    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "medicines",
        filter: `user_id=eq.${userId}`,
      },
      scheduleRefetch
    );

    ch.subscribe();

    // ✅ 탭 포커스/재연결 시 정합성 보정
    const onFocus = () => scheduleRefetch();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      if (refetchTimer.current) window.clearTimeout(refetchTimer.current);
      supabase.removeChannel(ch);
    };
  }, [supabase, userId]);

  if (!medicines?.length) return <EmptyMedicine />;

  const items = sortMedicinesByToday(medicines.map(mapToCardModel));

  return (
    <div className="flex flex-col gap-8 !mt-6">
      {items.map((m) => (
        <MedicineCard
          key={m.id.toString()}
          id={m.id}
          name={m.name}
          imageUrl={m.imageUrl}
          description={m.description}
          schedules={m.schedules}
        />
      ))}
    </div>
  );
}
