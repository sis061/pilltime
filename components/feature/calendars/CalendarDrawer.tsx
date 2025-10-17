// components/feature/calendars/CalendarDrawer.tsx
"use client";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "react-responsive";
import { useRouter } from "next/navigation";
import CalendarShell from "./CalendarShell";
import type { MonthIndicatorMap } from "@/types/calendar";

export default function CalendarDrawer({
  open,
  onOpenChange,
  dateParam,
  monthMap,
  todayYmd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateParam: string | null;
  monthMap?: MonthIndicatorMap;
  todayYmd?: string;
}) {
  const router = useRouter();
  const minTablet = useMediaQuery({ minWidth: 768 });

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
        else onOpenChange(true);
      }}
      direction={minTablet ? "right" : "bottom"}
      repositionInputs={false}
    >
      <DrawerContent className="!p-4 bg-slate-100 h-[95dvh] md:h-[100dvh] md:w-[480px] md:!ml-auto md:top-0 md:rounded-tr-none md:rounded-bl-[10px] w-full">
        <DrawerTitle className="text-md" hidden>
          복용 달력
        </DrawerTitle>

        <CalendarShell
          dateParam={dateParam}
          onChangeDate={(next) => router.replace(`/calendar?d=${next}`)}
          layout="drawer"
          monthMap={monthMap}
          todayYmdOverride={todayYmd}
        />
      </DrawerContent>
    </Drawer>
  );
}
