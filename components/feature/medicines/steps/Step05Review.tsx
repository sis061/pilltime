"use client";

import { useWizard } from "react-use-wizard";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { MedicineFormValues } from "@/lib/schemas/medicine";
import { DAYS } from "../form/MedicineSchedulesField";
import { useReturnToStore } from "@/store/returnTo";
import { formatTime } from "@/lib/date";
import { useEffect } from "react";
import Image from "next/image";

export function Step05Review() {
  const { activeStep, goToStep } = useWizard();
  const { getValues, setValue } = useFormContext<MedicineFormValues>();
  const { setReturnTo } = useReturnToStore();

  const values = getValues();

  const sortedSchedules = [...values.schedules].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  const filteredEmptyDescription =
    values.description &&
    [...values.description].filter((v) => v.value?.length > 0);

  useEffect(() => {
    setValue("description", filteredEmptyDescription);
  }, [values.description, setValue]);

  const sortedDaysOfWeek = [
    ...(values.repeated_pattern.days_of_week ?? []),
  ].sort((a, b) => a - b);
  const sortedDaysOfMonth = [
    ...(values.repeated_pattern.days_of_month ?? []),
  ].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-6 !pb-8 !-mt-4 overflow-y-auto">
      <h2 className="text-sm font-bold !text-pilltime-grayDark/40">
        마지막으로 정보가 맞는지 확인하고 저장하세요
      </h2>

      {/* 이름 */}
      <div className="flex items-center justify-between !pb-2 shadow-2xs">
        <div>
          <strong>이름</strong> {values.name}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="!text-pilltime-violet cursor-pointer"
          onClick={() => {
            setReturnTo(activeStep);
            goToStep(0);
          }} // Step1로 이동
        >
          수정
        </Button>
      </div>

      {/* 상세 정보 */}
      <div className="flex items-start justify-between shadow-2xs !pb-2">
        <div className="flex flex-col gap-2">
          <strong>상세 정보</strong>
          {filteredEmptyDescription!.length > 0 ? (
            <ul className="list-disc list-inside text-sm flex flex-col gap-1">
              {filteredEmptyDescription?.map((d, i) => (
                <li key={i}>{d.value}</li>
              ))}
            </ul>
          ) : (
            <span className="text-sm !text-pilltime-grayDark/40">
              상세 정보가 없습니다
            </span>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="!text-pilltime-violet cursor-pointer"
          onClick={() => {
            setReturnTo(activeStep);
            goToStep(1);
          }} // Step2로 이동
        >
          수정
        </Button>
      </div>

      {/* 복용 주기 */}
      <div className="flex items-start justify-between shadow-2xs !pb-2">
        <div className="flex flex-col gap-2">
          <strong>복용 주기</strong>
          <p className="text-sm">
            {values.repeated_pattern?.type === "DAILY" && "매일"}
            {values.repeated_pattern?.type === "WEEKLY" &&
              `매주 ${sortedDaysOfWeek?.map((d) => DAYS[d]).join(", ")}`}
            {values.repeated_pattern?.type === "MONTHLY" &&
              `매달 ${sortedDaysOfMonth?.map((d) => `${d}일`).join(", ")}`}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="!text-pilltime-violet cursor-pointer"
          onClick={() => {
            setReturnTo(activeStep);
            goToStep(2);
          }} // Step3로 이동
        >
          수정
        </Button>
      </div>

      {/* 복용 시간 */}
      <div className="flex items-start justify-between shadow-2xs !pb-2">
        <div className="flex flex-col gap-2">
          <strong>복용 시간</strong>
          <ul className="list-disc list-inside text-sm flex flex-col gap-1">
            {sortedSchedules?.map((s, i) => (
              <li key={i}>{formatTime(s.time)}</li>
            ))}
          </ul>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="!text-pilltime-violet cursor-pointer"
          onClick={() => {
            setReturnTo(activeStep);
            goToStep(2);
          }} // Step3로 이동
        >
          수정
        </Button>
      </div>

      {/* 이미지 */}
      <div className="flex items-center justify-between !pb-2">
        <div className="flex flex-col gap-2">
          <strong>이미지</strong>
          {values.imageUrl && (
            <Image
              src={values.imageUrl}
              alt="약 이미지"
              width={160}
              height={160}
              className="object-cover rounded-md mt-2"
            />
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="!text-pilltime-violet cursor-pointer"
          onClick={() => {
            setReturnTo(activeStep);
            goToStep(3);
          }} // Step4로 이동
        >
          수정
        </Button>
      </div>
    </div>
  );
}
