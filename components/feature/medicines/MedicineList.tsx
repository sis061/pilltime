"use client";

import MedicineCard from "@/components/feature/medicines/MedicineCard";

interface MedicineListSectionProps {
  medicines: any[];
}

export default function MedicineList({ medicines }: MedicineListSectionProps) {
  if (medicines.length === 0) {
    return (
      <p className="mt-6 text-lg text-gray-500">아직 등록된 약이 없습니다.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-6">
      {medicines.map((m) => (
        <MedicineCard
          key={m.id.toString()}
          id={m.id.toString()}
          name={m.name}
          imageUrl={m.image_url ?? ""}
          description={m.description ?? []}
          schedules={m.medicine_schedules ?? []}
        />
      ))}
    </div>
  );
}
