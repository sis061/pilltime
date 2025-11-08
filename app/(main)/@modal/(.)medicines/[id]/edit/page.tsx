"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MedicineEditDrawer from "@/components/feature/medicines/MedicineEditDrawer";

export default function EditMedicinePage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <MedicineEditDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) router.back();
      }}
    />
  );
}
