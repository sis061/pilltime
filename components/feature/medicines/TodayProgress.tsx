"use client";

import { useMemo } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { toYYYYMMDD } from "@/lib/date";
import type { IntakeLog, MedicineSchedule } from "@/types/medicines";

function getTodaysLogPercentage(
  schedules: MedicineSchedule[],
  pending: Record<number, IntakeLog["status"]>
) {
  const tz = (schedules[0]?.repeated_pattern as any)?.tz || "Asia/Seoul";
  const dateStr = toYYYYMMDD(new Date(), tz);

  const logs = schedules
    .flatMap((s) => s.intake_logs)
    .filter((l) => l.date === dateStr)
    .map((l) => (pending[l.id] ? { ...l, status: pending[l.id] } : l));

  if (!logs.length) return 0;

  const taken = logs.reduce((a, l) => a + (l.status === "taken" ? 1 : 0), 0);

  return Math.floor((taken / logs.length) * 100);
}

export default function TodayProgress({
  schedules,
  pending,
  className = "",
}: {
  schedules: MedicineSchedule[];
  pending: Record<number, IntakeLog["status"]>;
  className?: string;
}) {
  const percentage = useMemo(
    () => getTodaysLogPercentage(schedules, pending),
    [schedules, pending]
  );

  const alpha = Math.max(percentage / 100, 0.15);
  return (
    <div className={className}>
      <CircularProgressbar
        value={percentage}
        text={`${percentage}%`}
        styles={buildStyles({
          rotation: 0,
          strokeLinecap: "round",
          textSize: "16px",
          pathTransitionDuration: 0.75,
          pathColor: `rgba(139, 92, 246, ${alpha})`,
          textColor: "#3B82F6",
          trailColor: "#f1f1f1",
          backgroundColor: "#3e98c7",
        })}
      />
    </div>
  );
}
