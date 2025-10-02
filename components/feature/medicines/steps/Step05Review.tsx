"use client";

import { useWizard } from "react-use-wizard";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { MedicineFormValues } from "../MedicineEditDrawer";

export function Step05Review() {
  const { goToStep } = useWizard();
  const { getValues } = useFormContext<MedicineFormValues>();

  const values = getValues();

  return (
    <div className="flex flex-col gap-6 !pb-8 !-mt-4">
      <h2 className="text-sm font-bold !text-pilltime-grayDark/40">
        마지막으로 정보가 맞는지 확인하고 저장하세요
      </h2>

      {/* 이름 */}
      <div className="flex items-center justify-between !pb-2 shadow-2xs">
        <div>
          <strong>이름</strong> {values.name}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="!text-pilltime-violet"
          onClick={() => goToStep(0)} // Step1로 이동
        >
          수정
        </Button>
      </div>

      {/* 상세 정보 */}
      <div className="flex items-start justify-between shadow-2xs !pb-2">
        <div className="flex flex-col gap-2">
          <strong>상세 정보</strong>
          <ul className="list-disc list-inside text-sm flex flex-col gap-1">
            {values.description?.map((d, i) => (
              <li key={i}>{d.value}</li>
            ))}
          </ul>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="!text-pilltime-violet"
          onClick={() => goToStep(1)} // Step2로 이동
        >
          수정
        </Button>
      </div>

      {/* 복용 시간 */}
      <div className="flex items-start justify-between shadow-2xs !pb-2">
        <div className="flex flex-col gap-2">
          <strong>복용 시간</strong>
          <ul className="list-disc list-inside text-sm flex flex-col gap-1">
            {values.schedules?.map((s, i) => (
              <li key={i}>{s.time}</li>
            ))}
          </ul>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="!text-pilltime-violet"
          onClick={() => goToStep(2)} // Step3로 이동
        >
          수정
        </Button>
      </div>

      {/* 이미지 */}
      <div className="flex items-center justify-between !pb-2">
        <div className="flex flex-col gap-2">
          <strong>이미지</strong>
          {values.imageUrl && (
            <img
              src={values.imageUrl}
              alt="약 이미지"
              className="w-48 h-48 object-cover rounded-md mt-2"
            />
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="!text-pilltime-violet"
          onClick={() => goToStep(3)} // Step4로 이동
        >
          수정
        </Button>
      </div>
    </div>
  );
}
