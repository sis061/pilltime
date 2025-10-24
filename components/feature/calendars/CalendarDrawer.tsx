"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import CalendarShell from "./CalendarShell";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useSSRMediaquery } from "@/hooks/useSSRMediaquery";
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
  const minTablet = useSSRMediaquery(768);

  // 클릭 시 즉시 반응하는 로컬 상태
  const [selectedYmd, setSelectedYmd] = React.useState<string | null>(
    dateParam ?? null
  );
  const syncTimer = React.useRef<number | null>(null);
  React.useEffect(() => {
    // 외부(Nav)로 URL이 바뀌면 대기중 replace 취소 + 로컬 동기화
    if (syncTimer.current) {
      window.clearTimeout(syncTimer.current);
      syncTimer.current = null;
    }
    setSelectedYmd(dateParam ?? null);
  }, [dateParam]);

  const requestUrlSync = React.useCallback(
    (ymd: string) => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
      syncTimer.current = window.setTimeout(() => {
        const current = new URLSearchParams(window.location.search).get("d");
        if (current === ymd) return; // 동일값 guard
        React.startTransition(() => {
          router.replace(`/calendar?d=${ymd}`, { scroll: false });
        });
      }, 250);
    },
    [router]
  );

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
          dateParam={selectedYmd}
          onChangeDate={(next) => {
            setSelectedYmd(next);
            requestUrlSync(next);
          }}
          layout="drawer"
          monthMap={monthMap}
          todayYmdOverride={todayYmd}
        />
      </DrawerContent>
    </Drawer>
  );
}
