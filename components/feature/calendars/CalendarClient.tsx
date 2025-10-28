"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import CalendarShell from "./CalendarShell";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useSSRMediaquery } from "@/hooks/useSSRMediaquery";
import type { MonthIndicatorMap } from "@/types/calendar";
import { useGlobalLoading } from "@/store/useGlobalLoading";

type Variant = "drawer" | "page";

type Props = {
  variant: Variant;
  dateParam: string | null;
  monthMap: MonthIndicatorMap;
  todayYmd: string;
  onClose?: () => void; // drawer에서만 사용
};

function useSelectedYmdSync(initial: string | null, variant: Variant) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedYmd, setSelectedYmd] = React.useState<string | null>(initial);
  const timerRef = React.useRef<number | null>(null);
  const lastSyncedRef = React.useRef<string | null>(initial);

  // 외부 dateParam 변동 시 로컬 동기화
  React.useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSelectedYmd(initial);
    lastSyncedRef.current = initial;
  }, [initial]);

  // 언마운트 시 타이머 정리
  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const requestUrlSync = React.useCallback(
    (ymd: string) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        const current = new URLSearchParams(window.location.search).get("d");
        if (current === ymd || lastSyncedRef.current === ymd) return;
        if (variant === "drawer") {
          React.startTransition(() => {
            router.replace(`/calendar?d=${ymd}`, { scroll: false });
            lastSyncedRef.current = ymd;
          });
        } else {
          if (typeof window !== "undefined") {
            const nextUrl = `${pathname || "/calendar"}?d=${ymd}`;
            window.history.replaceState(null, "", nextUrl);
            lastSyncedRef.current = ymd;
          }
        }
      }, 250);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router]
  );

  const onChangeDate = React.useCallback(
    (next: string) => {
      setSelectedYmd(next);
      requestUrlSync(next);
    },
    [requestUrlSync]
  );

  return { selectedYmd, onChangeDate };
}

export default function CalendarClient({
  variant,
  dateParam,
  monthMap,
  todayYmd,
  onClose,
}: Props) {
  const router = useRouter();
  const { selectedYmd, onChangeDate } = useSelectedYmdSync(dateParam, variant);
  const { stopLoading } = useGlobalLoading();

  React.useEffect(() => {
    // 페이지/드로어가 보이면 안전하게 끄기
    stopLoading("open-calendar");
  }, [stopLoading]);

  const minTablet = useSSRMediaquery(768);
  const [open, setOpen] = React.useState(true);
  if (variant === "drawer") {
    return (
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(false);
            stopLoading("open-calendar");
            router.back();
            onClose?.();
          } else {
            setOpen(true);
          }
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
            onChangeDate={onChangeDate}
            layout="drawer"
            monthMap={monthMap}
            todayYmdOverride={todayYmd}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  // full page
  return (
    <CalendarShell
      dateParam={selectedYmd}
      onChangeDate={onChangeDate}
      layout="page"
      monthMap={monthMap}
      todayYmdOverride={todayYmd}
    />
  );
}
