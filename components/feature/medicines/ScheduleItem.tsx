"use client";

// TODO 알람 기능 구현

import { useEffect, useMemo, useState, useTransition } from "react";
// ---- UI
import { toast } from "sonner";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { Check, PinOff, SkipForward } from "lucide-react";
// ---- UTIL
import { formatTime } from "@/lib/date";
import { getTodayIntakeLog } from "@/lib/medicine";
// ---- TYPE
import { IntakeLog, MedicineSchedule } from "@/types/medicines";

type ScheduleItemProps = MedicineSchedule & {
  onOptimisticSet: (logId: number, status: IntakeLog["status"]) => void;
  onOptimisticClear: (logId: number) => void;
};

export const RenderStatusText = (status: IntakeLog["status"]) => {
  let content;

  switch (status) {
    case "taken":
      content = "먹었어요!";
      break;
    case "skipped":
      content = "안 먹을래요";
      break;
    case "missed":
      content = "지났어요!";
      break;
    case "scheduled":
      content = "";
      break;
    default:
      content = "";
      break;
  }
  return content;
};

export default function ScheduleItem(schedule: ScheduleItemProps) {
  const todayLog = useMemo(() => getTodayIntakeLog(schedule), [schedule]);
  const initialStatus: IntakeLog["status"] = todayLog?.status ?? "scheduled";

  const [status, setStatus] = useState<IntakeLog["status"]>(initialStatus);
  const [_isPending, startTransition] = useTransition();

  const isTaken = status === "taken";
  const isSkipped = status === "skipped";
  const isMissed = status === "missed";

  useEffect(() => {
    setStatus(todayLog?.status ?? "scheduled");
  }, [todayLog?.status]);

  function onButtonClick(value: IntakeLog["status"]) {
    if (!todayLog) return;
    startTransition(() => void putIntakeLog(todayLog.id, value));
  }

  /* ---------------------------
   * API
   * --------------------------- */

  async function putIntakeLog(id: number, next: IntakeLog["status"]) {
    const prev = status;
    // const optimisticCheckedAt =
    //   next === "taken" ? new Date().toISOString() : null;

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
          // checked_at: optimisticCheckedAt,
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

  return (
    <div className="flex items-center w-full justify-between gap-4 border-t border-t-pilltime-teal/50 !pt-4 !px-4">
      <div className="flex-col flex grow items-start">
        <p
          className={`!text-pilltime-grayDark/90 text-2xl
            ${
              (isTaken || isSkipped) &&
              "line-through decoration-pilltime-teal/50"
            }`}
        >
          {formatTime(schedule?.time)}
        </p>
        <span className="text-sm !text-pilltime-grayDark/60 ">
          {RenderStatusText(status)}
        </span>
      </div>

      <ButtonGroup className="[&_button]:!px-4 [&_button]:!py-2 [&_>button]:shadow-xs [&_>button]:cursor-pointer [&_>button]:transition-colors [&_>button]:duration-150 [&_>button]:focus-visible:outline-none [&_>button]:focus-visible:ring-2 [&_>button]:focus-visible:ring-offset-2 [&_>button]:focus-visible:ring-slate-300">
        <Button
          type="button"
          size="icon"
          disabled={_isPending || !todayLog}
          variant="secondary"
          className={` hover:!bg-pilltime-blue/50 hover:[&_svg]:stroke-white
              ${isTaken && "bg-pilltime-blue [&_>svg]:stroke-white"}
              ${isSkipped && "[&_>svg]:!stroke-pilltime-teal/50"}
              ${
                isMissed &&
                "[&_>svg]:!stroke-pilltime-teal bg-red-700 [&_>svg]:animate-pulse"
              }`}
          onClick={() => onButtonClick("taken")}
        >
          <Check strokeWidth={2.5} />
        </Button>
        <ButtonGroupSeparator />
        <Button
          type="button"
          size="icon"
          disabled={_isPending || !todayLog}
          variant="secondary"
          className={`hover:!bg-pilltime-yellow/50 hover:[&_svg]:stroke-white
            ${isSkipped && "!bg-pilltime-yellow [&_svg]:stroke-white"}
            ${isTaken && "[&_>svg]:!stroke-pilltime-teal/50"}
          ${
            isMissed &&
            "[&_>svg]:!stroke-pilltime-teal bg-red-700 [&_>svg]:animate-pulse "
          }`}
          onClick={() => onButtonClick("skipped")}
        >
          {/* <SkipForward strokeWidth={2.5} /> */}
          <PinOff strokeWidth={2.5} />
        </Button>
      </ButtonGroup>
    </div>
  );
}
