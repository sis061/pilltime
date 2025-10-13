import { MedicineDetail } from "@/app/types/medicines";
import MedicineCard, {
  RenderTodaysMedicine,
} from "@/components/feature/medicines/MedicineCard";

function mapToCardModel(m: any): MedicineDetail {
  return {
    id: m.id,
    name: m.name,
    imageUrl: m.image_url ?? "",
    description: m.description ?? [],
    schedules: m.medicine_schedules ?? [],
  };
}

export function sortMedicinesByToday(
  medicines: MedicineDetail[]
): MedicineDetail[] {
  return [...medicines].sort((a, b) => {
    const aHasToday = a.schedules.some((s) =>
      RenderTodaysMedicine(s.repeated_pattern)
    );
    const bHasToday = b.schedules.some((s) =>
      RenderTodaysMedicine(s.repeated_pattern)
    );

    if (aHasToday === bHasToday) return 0;
    return aHasToday ? -1 : 1; // 오늘 복용하는 약 → 앞으로
  });
}

export default function MedicineList({ medicines }: { medicines: any[] }) {
  if (!medicines || medicines.length === 0) {
    return (
      <p className="mt-6 text-lg text-gray-500">아직 등록된 약이 없습니다.</p>
    );
  }

  const items = sortMedicinesByToday(medicines.map(mapToCardModel));

  return (
    <div className="flex flex-col gap-4 mt-6">
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
