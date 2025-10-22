"use client";

import "dayjs/locale/ko";
import dayjs from "dayjs";
dayjs.locale("ko");
// ---- REACT
import * as React from "react";
// ---- COMPONENT
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import TimePicker from "antd/es/time-picker";
import koKR from "antd/locale/ko_KR";
// ---- UTIL
import { MedicineFormValues } from "@/lib/schemas/medicine";
// ---- LIB
import { useFormContext, useFieldArray, Controller } from "react-hook-form";

/* ------
 CONST
------ */

export const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_DATES = [1, 10, 20, 30];
const OPTIONS: { value: "DAILY" | "WEEKLY" | "MONTHLY"; label: string }[] = [
  { value: "DAILY", label: "매일" },
  { value: "WEEKLY", label: "매주" },
  { value: "MONTHLY", label: "매달" },
];

const tpLocale =
  // v5에서 TimePicker 전용 로케일이 있으면 사용
  (koKR as any).TimePicker ??
  // 없으면 DatePicker 안의 timePickerLocale로 폴백
  (koKR as any).DatePicker?.timePickerLocale;

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
    keyName: "__key",
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

    // ⬇️ 시간필드 리셋하되 신규로 인식되도록 id:null 유지
    replace([{ id: null as any, time: "" } as any]);
  };

  // const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  const isTimeFieldVisible =
    repeatedPattern.type === "DAILY" ||
    (Array.isArray(weekly) && weekly.length > 0) ||
    (Array.isArray(monthly) && monthly.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {/* 복용 주기 */}
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
                variant="default"
                onClick={() => {
                  document.getElementById(opt.value)?.click();
                  setValue("repeated_pattern.type", opt.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
                className={`!px-4 !py-2 shadow-xs cursor-pointer  ${
                  repeatedPattern.type === opt.value &&
                  "!bg-pilltime-blue !text-white "
                }`}
              >
                {opt.label}
              </Button>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* 매주: 요일 */}
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
                  setValue(
                    "repeated_pattern.days_of_week",
                    [...next].sort((a, b) => a - b),
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    }
                  );
                }}
                className={`!p-2 w-[calc((100%/7)-0.43rem)] shadow-xs cursor-pointer ${
                  selected && "!bg-pilltime-blue !text-white "
                }`}
              >
                {day}
              </Button>
            );
          })}
        </div>
      )}

      {/* 매달: 날짜 */}
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
                  setValue(
                    "repeated_pattern.days_of_month",
                    [...next].sort((a, b) => a - b),
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    }
                  );
                }}
                className={`!p-2 w-[calc((100%/4)-0.43rem)] shadow-xs cursor-pointer ${
                  selected && "!bg-pilltime-blue !text-white "
                }`}
              >
                {date}일
              </Button>
            );
          })}
        </div>
      )}

      {/* 시간 필드 */}
      {isTimeFieldVisible && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold">복용 시간</label>

          {fields.map((f, index) => (
            <div key={f.__key} className="flex flex-col gap-2 items-center">
              <div className="flex gap-2 items-center w-full">
                {/* ✅ 도메인 PK(id) 숨김 input → diff용으로 서버에 항상 전달 */}
                <input
                  type="hidden"
                  {...register(`schedules.${index}.id`, {
                    setValueAs: (v) =>
                      v === "" || v == null
                        ? null
                        : Number.isNaN(Number(v))
                        ? v
                        : Number(v),
                  })}
                />

                <Controller
                  control={control}
                  name={`schedules.${index}.time`}
                  rules={{ required: "필수 항목입니다!" }}
                  render={({ field, fieldState }) => {
                    return (
                      <div
                        // ref={wrapperRef}
                        className="w-full border-pilltime-grayLight"
                      >
                        <TimePicker
                          locale={tpLocale}
                          value={
                            field.value ? dayjs(field.value, "HH:mm") : null
                          }
                          onChange={(v) =>
                            field.onChange(v ? v.format("HH:mm") : "")
                          }
                          minuteStep={5}
                          hideDisabledOptions
                          needConfirm={false}
                          showNow={false}
                          showSecond={false}
                          format={(val) =>
                            val ? dayjs(val).locale("ko").format("A hh:mm") : ""
                          }
                          inputReadOnly
                          variant="borderless"
                          allowClear={false}
                          placeholder="약 먹을 시간을 입력하세요"
                          className="!px-2 !py-2 shadow-sm w-[98%] !ml-1"
                          getPopupContainer={(trigger) =>
                            (trigger?.parentElement as HTMLElement) ??
                            document.body
                          }
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    );
                  }}
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
            </div>
          ))}

          {/* 신규는 항상 id:null → insert로 인식 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="max-w-20 w-full self-center cursor-pointer"
            onClick={() => append({ id: null as any, time: "" } as any)}
          >
            추가
          </Button>
        </div>
      )}

      {/* 에러 */}
      {errors.repeated_pattern?.type && (
        <p className="!text-red-500 text-sm !mt-1">
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
