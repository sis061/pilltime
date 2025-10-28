"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MedicineNewDrawer from "@/components/feature/medicines/MedicineNewDrawer";

export default function NewMedicinePage() {
  const router = useRouter();
  const q = useSearchParams();
  const pathname = usePathname();
  const returnTo = q.get("returnTo") ?? "/";

  // ✅ 부모가 open을 제어
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (pathname?.startsWith("/medicines/new")) {
      setOpen(true);
    }
  }, [pathname, q]);

  return (
    <MedicineNewDrawer
      key={q.toString()}
      open={open}
      onOpenChange={(next) => {
        // ✅ 먼저 시각적으로 닫고
        setOpen(next);
        if (!next) {
          // ✅ 그 다음 틱에 정착 경로로 replace (히스토리 의존 X)
          queueMicrotask(() => {
            router.replace(returnTo, { scroll: false });
          });
        }
      }}
    />
  );
}
