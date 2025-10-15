"use client";

// TODO 알람 기능 구현
// TODO 복용 로그에 따라 스티커 붙이기

import { IntakeLog, MedicineSchedule } from "@/types/medicines";
import { Switch } from "@/components/ui/switch";
import { formatTime } from "@/lib/date";
import { getTodayIntakeLog } from "@/lib/medicine";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type ScheduleItemProps = MedicineSchedule & {
  onOptimisticSet: (logId: number, status: IntakeLog["status"]) => void;
  onOptimisticClear: (logId: number) => void;
};

export default function ScheduleItem(schedule: ScheduleItemProps) {
  const todayLog = useMemo(() => getTodayIntakeLog(schedule), [schedule]);
  const initialStatus: IntakeLog["status"] = todayLog?.status ?? "scheduled";

  const [status, setStatus] = useState<IntakeLog["status"]>(initialStatus);
  const [_isPending, startTransition] = useTransition();
  const isTaken = status === "taken";

  useEffect(() => {
    setStatus(todayLog?.status ?? "scheduled");
  }, [todayLog?.status]);

  async function putIntakeLog(id: number, next: IntakeLog["status"]) {
    const prev = status;
    const optimisticCheckedAt =
      next === "taken" ? new Date().toISOString() : null;

    // 낙관 반영
    setStatus(next);
    schedule.onOptimisticSet(id, next);

    try {
      const res = await fetch(`/api/intake`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: next,
          checked_at: optimisticCheckedAt,
          source: "manual",
        }),
      });

      if (!res.ok) {
        toast.error("기록하는 중 문제가 발생했어요");
        throw new Error(await res.text());
      }

      // ✅ 성공 시에는 pending을 여기서 지우지 않는다!
      // (실제 데이터가 업데이트되어 schedules가 바뀌면, 상위 useEffect가 감지하고 지움)
    } catch {
      // 실패 롤백은 즉시 수행
      setStatus(prev);
      schedule.onOptimisticSet(id, prev);
      schedule.onOptimisticClear(id);
    }
  }

  function onToggle(checked: boolean) {
    if (!todayLog) return;
    const next: IntakeLog["status"] = checked ? "taken" : "skipped";
    startTransition(() => void putIntakeLog(todayLog.id, next));
  }

  return (
    <div className="flex items-center w-full justify-between gap-4 border-t border-t-pilltime-teal/50 !pt-4 !px-4">
      <span className="!text-pilltime-grayDark/75">
        {formatTime(schedule?.time)}
      </span>
      <Switch
        checked={isTaken}
        disabled={_isPending || !todayLog}
        onCheckedChange={onToggle}
        className={`${
          status === "missed" && "!bg-black/75 [&_span]:!bg-red-500"
        } `}
      />
    </div>
  );
}
