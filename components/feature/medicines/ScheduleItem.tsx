"use client";

// TODO 알람 기능 구현
// TODO 복용 로그에 따라 스티커 붙이기

import { IntakeLog, MedicineSchedule } from "@/types/medicines";
import { Switch } from "@/components/ui/switch";
import { formatTime } from "@/lib/date";
import { getTodayIntakeLog } from "@/lib/medicine";
import { useEffect, useMemo, useState, useTransition } from "react";

export default function ScheduleItem(schedule: MedicineSchedule) {
  const todayLog = useMemo(() => getTodayIntakeLog(schedule), [schedule]);
  const initialStatus: IntakeLog["status"] = todayLog?.status ?? "scheduled";

  const [status, setStatus] = useState<IntakeLog["status"]>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const isTaken = status === "taken";

  useEffect(() => {
    setStatus(todayLog?.status ?? "scheduled");
  }, [todayLog?.status]);

  async function putIntakeLog(id: number, next: IntakeLog["status"]) {
    const optimisticPrev = status;
    const optimisticCheckedAt =
      next === "taken" ? new Date().toISOString() : null;

    setStatus(next);

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

      if (!res.ok) throw new Error(await res.text());
    } catch {
      setStatus(optimisticPrev);
    }
  }

  function onToggle(checked: boolean) {
    if (!todayLog) return;
    const next: IntakeLog["status"] = checked ? "taken" : "skipped";
    startTransition(() => void putIntakeLog(todayLog.id, next));
  }

  return (
    <div className="flex items-center w-full justify-between gap-4 border-t border-t-pilltime-teal/50 !pt-4 !px-4">
      <span>{formatTime(schedule?.time)}</span>
      <Switch
        checked={isTaken}
        onCheckedChange={onToggle}
        className={`${
          status === "missed" && "!bg-black/75 [&_span]:!bg-red-500"
        } `}
      />
    </div>
  );
}
