"use client";

import { useRouter } from "next/navigation";
import MedicineNewDrawer from "@/components/feature/medicines/MedicineNewDrawer";

export default function NewMedicinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  return (
    <MedicineNewDrawer
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          router.back(); // 닫으면 원래 페이지로 돌아감
        }
      }}
    />
  );
}
