"use client";

import "dayjs/locale/ko";
import dayjs from "dayjs";
dayjs.locale("ko");
// ---- REACT
import * as React from "react";
// ---- COMPONENT
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import TimePicker, { TimePickerProps } from "antd/es/time-picker";
import koKR from "antd/locale/ko_KR";
// ---- UTIL
import { MedicineFormValues } from "@/lib/schemas/medicine";
// ---- LIB
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import type { Dayjs } from "dayjs";

/* ------
 TYPES
------ */

type Props = Omit<TimePickerProps, "onChange" | "value"> & {
  value: Dayjs | null; // 외부(RHF) 값
  onCommit?: (v: Dayjs | null) => void; // 최종 커밋 때만 호출
  closeAfterCommit?: boolean; // 기본 true
};

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
                    const wrapperRef = React.useRef<HTMLDivElement | null>(
                      null
                    );
                    return (
                      <div
                        ref={wrapperRef}
                        className="w-full border-pilltime-grayLight"
                      >
                        {/* <TimePicker
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
                          variant="borderless"
                          allowClear={false}
                          placeholder="약 먹을 시간을 입력하세요"
                          className="!px-2 !py-2 shadow-sm w-[98%] !ml-1"
                          getPopupContainer={(trigger) =>
                            (trigger?.parentElement as HTMLElement) ??
                            document.body
                          }
                        /> */}
                        <AutoCloseTimePicker
                          value={
                            field.value ? dayjs(field.value, "HH:mm") : null
                          }
                          onCommit={(v) =>
                            field.onChange(v ? v.format("HH:mm") : "")
                          }
                          minuteStep={5}
                          hideDisabledOptions
                          needConfirm={false}
                          showNow={false}
                          showSecond={false}
                          format="HH:mm"
                          locale={tpLocale}
                          variant="borderless"
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

// AutoCloseTimePicker.tsx

/**
 * - needConfirm={false} + controlled open
 * - onCalendarChange 시 패널 닫고 인풋 blur로 재오픈 방지
 * - inputReadOnly로 모바일 키보드 튐 방지
 */

export default function AutoCloseTimePicker({
  value,
  onCommit,
  closeAfterCommit = true,
  allowClear = false,
  needConfirm = false,
  showSecond = false,
  showNow = false,
  inputReadOnly = true,
  ...rest
}: Props) {
  // 패널 open 제어
  const [open, setOpen] = React.useState(false);
  // 임시 선택값(시/분 중 하나만 고른 상태)
  const [temp, setTemp] = React.useState<Dayjs | null>(null);
  // 이번 오픈 동안 몇 번 선택했는지
  const selectCountRef = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // 패널 열릴 때 상태 초기화
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      selectCountRef.current = 0;
      setTemp(null);
    }
  };

  // 화면에 보일 값: 임시값이 있으면 그걸 우선 표시
  const displayValue = temp ?? value ?? null;

  return (
    <TimePicker
      {...rest}
      ref={(inst: any) => {
        // antd 내부 input 추적 (재오픈 방지용 blur에 사용)
        inputRef.current =
          inst?.nativeElement ?? inst?.input ?? inst?.picker?.input ?? null;
      }}
      value={displayValue}
      open={open}
      onOpenChange={handleOpenChange}
      needConfirm={needConfirm}
      showSecond={showSecond}
      showNow={showNow}
      allowClear={allowClear}
      inputReadOnly={inputReadOnly}
      // 패널에서 칸을 클릭할 때마다 호출됨(시/분 각각)
      onCalendarChange={(v) => {
        const _v = Array.isArray(v) ? v[0] : v;

        selectCountRef.current += 1;
        if (selectCountRef.current >= 2) {
          // 2번째 선택: 최종 커밋
          onCommit?.(_v);
          if (closeAfterCommit) {
            setOpen(false);
            // 즉시 재오픈 방지
            queueMicrotask(() => inputRef.current?.blur());
          }
          // 커밋 후 임시 상태 초기화
          setTemp(null);
          selectCountRef.current = 0;
        } else {
          // 1번째 선택: 임시값만 보이게 하고 커밋은 보류
          setTemp(_v);
        }
      }}
    />
  );
}
