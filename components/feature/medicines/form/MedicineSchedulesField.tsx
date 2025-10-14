"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useFormContext, useFieldArray } from "react-hook-form";
import { useState } from "react";
import { MedicineFormValues } from "@/lib/schemas/medicine";

export const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_DATES = [1, 10, 20, 30];
const OPTIONS: { value: "DAILY" | "WEEKLY" | "MONTHLY"; label: string }[] = [
  { value: "DAILY", label: "매일" },
  { value: "WEEKLY", label: "매주" },
  { value: "MONTHLY", label: "매달" },
];

export function MedicineSchedulesField() {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
    clearErrors,
  } = useFormContext<MedicineFormValues>();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "schedules",
  });
  register("repeated_pattern.type", { required: "복용 주기를 선택해주세요!" });
  const repeatedPattern = watch("repeated_pattern") ?? { type: "" };
  const weekly: number[] = watch("repeated_pattern.days_of_week") ?? [];
  const monthly: number[] = watch("repeated_pattern.days_of_month") ?? [];

  const handlePatternChange = (val: "DAILY" | "WEEKLY" | "MONTHLY") => {
    setValue("repeated_pattern.type", val, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    clearErrors([
      "repeated_pattern.days_of_week",
      "repeated_pattern.days_of_month",
      "schedules",
    ]);

    // 하위 옵션 초기화
    if (val === "DAILY") {
      setValue("repeated_pattern.days_of_week", [], { shouldDirty: true });
      setValue("repeated_pattern.days_of_month", [], { shouldDirty: true });
    }
    if (val === "WEEKLY") {
      setValue("repeated_pattern.days_of_month", [], { shouldDirty: true });
    }
    if (val === "MONTHLY") {
      setValue("repeated_pattern.days_of_week", [], { shouldDirty: true });
    }

    // ⬇️ 시간 필드는 replace로 UI까지 리셋
    replace([{ time: "" }]);
  };

  const isTimeFieldVisible =
    repeatedPattern.type === "DAILY" ||
    (Array.isArray(weekly) && weekly.length > 0) ||
    (Array.isArray(monthly) && monthly.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold">복용 주기</label>
        <RadioGroup
          value={repeatedPattern.type}
          onValueChange={handlePatternChange}
          className="flex gap-2"
        >
          {OPTIONS.map((opt) => (
            <div key={opt.value} className="relative">
              <RadioGroupItem id={opt.value} value={opt.value} hidden />
              <Button
                type="button"
                variant={"default"}
                onClick={() => {
                  const hiddenInput = document.getElementById(
                    opt.value
                  ) as HTMLInputElement | null;
                  hiddenInput?.click();

                  setValue("repeated_pattern.type", opt.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
                className={`!px-4 !py-2  ${
                  repeatedPattern.type === opt.value &&
                  "!bg-pilltime-blue !text-white cursor-pointer"
                }`}
              >
                {opt.label}
              </Button>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* 매주: 요일 선택 */}
      {repeatedPattern.type === "WEEKLY" && (
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day, i) => {
            const selected = weekly.includes(i);
            return (
              <Button
                key={i}
                type="button"
                size="sm"
                variant="default"
                onClick={() => {
                  const next = selected
                    ? weekly.filter((d) => d !== i)
                    : [...weekly, i];
                  const sortedWeekly = [...next].sort((a, b) => a - b);
                  setValue("repeated_pattern.days_of_week", sortedWeekly, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  // 시간도 최소 1개 보장하도록 필요 시 유지/리셋 선택
                }}
                className={`!p-2 w-[calc((100%/7)-0.43rem)] ${
                  selected && "!bg-pilltime-blue !text-white cursor-pointer"
                }`}
              >
                {day}
              </Button>
            );
          })}
        </div>
      )}

      {/* 매달: 날짜 선택 */}
      {repeatedPattern.type === "MONTHLY" && (
        <div className="flex flex-wrap gap-2">
          {MONTH_DATES.map((date) => {
            const selected = monthly.includes(date);
            return (
              <Button
                key={date}
                type="button"
                size="sm"
                variant="default"
                onClick={() => {
                  const next = selected
                    ? monthly.filter((d) => d !== date)
                    : [...monthly, date];
                  const sortedMonthly = [...next].sort((a, b) => a - b);
                  setValue("repeated_pattern.days_of_month", sortedMonthly, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                className={`!p-2 w-[calc((100%/4)-0.43rem)] ${
                  selected && "!bg-pilltime-blue !text-white cursor-pointer"
                }`}
              >
                {date}일
              </Button>
            );
          })}
        </div>
      )}

      {/**************  시간 필드 **************/}
      {isTimeFieldVisible && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold">복용 시간</label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-2 items-center">
              <div className="flex gap-2 items-center w-full">
                <input
                  type="time"
                  {...register(`schedules.${index}.time` as const, {
                    required: "필수 항목입니다!",
                  })}
                  className="!p-2 border border-slate-100 shadow-sm rounded w-full"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="!text-red-500 cursor-pointer"
                  onClick={() => remove(index)}
                >
                  삭제
                </Button>
              </div>

              {errors.schedules?.[index]?.time && (
                <p className="!text-red-500 text-sm w-full">
                  {errors.schedules[index]?.time?.message}
                </p>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="max-w-20 w-full self-center cursor-pointer"
            onClick={() => append({ time: "" })}
          >
            추가
          </Button>
        </div>
      )}

      {errors.repeated_pattern?.type && (
        <p className="!text-red-500 text-sm">
          {errors.repeated_pattern.type.message}
        </p>
      )}
      {errors.repeated_pattern?.days_of_week && (
        <p className="!text-red-500 text-sm !mt-1">
          {errors.repeated_pattern.days_of_week.message}
        </p>
      )}
      {errors.repeated_pattern?.days_of_month && (
        <p className="!text-red-500 text-sm mt-1">
          {errors.repeated_pattern.days_of_month.message}
        </p>
      )}
      {errors.schedules && (
        <p className="!text-red-500 text-sm !mt-1">
          {errors.schedules?.message}
        </p>
      )}
    </div>
  );
}
