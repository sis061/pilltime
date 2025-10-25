// components/feature/medicines/MedicineNotifyToggle.tsx
"use client";

/**
 * 약별 알림 토글 아이콘
 * - 활성 상태: Bell 또는 AlarmClock 아이콘
 * - 비활성 상태: BellOff 또는 AlarmClockOff 아이콘
 * - 클릭 시 낙관적 업데이트 후 /api/medicines/[id]/notify PATCH 호출
 */

import * as React from "react";
import { AlarmClock, AlarmClockOff } from "lucide-react";
import { toast } from "sonner";
import { useGlobalNotify } from "@/hooks/useGlobalNotify";
import { useSSRMediaquery } from "@/hooks/useSSRMediaquery";
import { usePush } from "@/hooks/usePush";
import { cn } from "@/lib/utils"; // shadcn 기본 유틸

type Props = {
  medicineName: string;
  medicineId: number;
  initialEnabled: boolean;
};

export function MedicineNotifyToggle({
  medicineName,
  medicineId,
  initialEnabled,
}: Props) {
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [pending, startTransition] = React.useTransition();
  const { enabled: globalOn, loading: globalLoading } = useGlobalNotify();
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const { notifyReady, refresh } = usePush(vapid);
  const minMobile = useSSRMediaquery(640);

  const handleToggle = () => {
    if (pending) return;

    if (!notifyReady || globalOn === false) {
      toast.info(
        `전체 알림이 꺼져 있어요. ${
          minMobile ? "상단" : "메뉴"
        }에서 먼저 켜 주세요.`
      );
      return;
    }

    const prev = enabled;
    const enableContent = enabled === true ? "껐어요" : "켰어요!";
    setEnabled(!enabled); // 낙관적 업데이트

    startTransition(async () => {
      try {
        const res = await fetch(`/api/medicines/${medicineId}/notify`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !enabled }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        toast.info(`${medicineName}의 알림을 ${enableContent}`);
      } catch (err) {
        // 실패 시 롤백
        console.error("알림 토글 실패:", err);
        setEnabled(prev);
        toast.error("알림 설정 변경에 실패했어요. 다시 시도해 주세요.");
      } finally {
        await refresh();
      }
    });
  };

  const isDisabled = pending || globalLoading;
  const visuallyOff = !notifyReady || globalOn === false || !enabled;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isDisabled}
      aria-label={visuallyOff ? "알림 끄기" : "알림 켜기"}
      title={
        globalOn === false
          ? "전체 알림이 꺼져 있어요"
          : enabled
          ? "알림 끄기"
          : "알림 켜기"
      }
      className={cn(
        "relative flex items-center justify-center p-2 rounded-md transition-colors cursor-pointer",
        (pending || globalLoading) && "opacity-50 cursor-wait"
      )}
    >
      {visuallyOff ? (
        <AlarmClockOff
          size={24}
          strokeWidth={2.5}
          color="#1F293775"
          className="transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110"
        />
      ) : (
        <AlarmClock
          size={24}
          strokeWidth={2.5}
          color="#3B82F6"
          className="transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110"
        />
      )}

      {/* pending 시 간단한 로더 표시 */}
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-md">
          <svg
            className="animate-spin h-4 w-4 text-pilltime-blue"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        </span>
      )}
    </button>
  );
}
