import MedicineCard from "@/components/feature/medicines/MedicineCard";
import EmptyMedicine from "./EmptyMedicine";
import { mapToCardModel, sortMedicinesByToday } from "@/lib/medicine";
import RealtimeBridge from "./RealtimeBridge"; // ⬅️ 클라 브리지

export default function MedicineList({
  medicines,
  userId,
}: {
  medicines: any[];
  userId: string;
}) {
  if (!medicines?.length) {
    return (
      <>
        <RealtimeBridge userId={userId} />
        <EmptyMedicine />
      </>
    );
  }

  const items = sortMedicinesByToday(medicines.map(mapToCardModel));

  return (
    <>
      <RealtimeBridge userId={userId} />
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
    </>
  );
}
