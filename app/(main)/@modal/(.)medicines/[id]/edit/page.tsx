"use client";

import { useRouter } from "next/navigation";
import MedicineEditDrawer from "@/components/feature/medicines/MedicineEditDrawer";

export default function EditMedicinePage() {
  const router = useRouter();

  return (
    <MedicineEditDrawer
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          router.back(); // 닫으면 원래 페이지로 돌아감
        }
      }}
    />
  );
}
