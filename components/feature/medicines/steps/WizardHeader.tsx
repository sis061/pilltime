"use client";

import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { useWizard } from "react-use-wizard";
import { useFormContext } from "react-hook-form";
import { useGlobalLoading } from "@/store/useGlobalLoading";
import { useReturnToStore } from "@/store/returnTo";

export function WizardHeader({
  submitBtnRef,
  onClose,
}: // onImageUploadCancel,
{
  submitBtnRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  // onImageUploadCancel?: () => void;
}) {
  const {
    previousStep,
    nextStep,
    isFirstStep,
    isLastStep,
    activeStep,
    goToStep,
    stepCount,
  } = useWizard();

  const { trigger } = useFormContext();
  const isLoading = useGlobalLoading((s) => s.isGLoading);
  const popReturnTo = useReturnToStore((s) => s.popReturnTo);
  const { returnToStep } = useReturnToStore();

  // 스텝별 검증 필드 매핑
  const stepValidationMap: Record<number, string[] | undefined> = {
    0: ["name"], // Step01: 약 이름
    1: ["repeated_pattern.type"], // Step02: 주기 선택
    2: ["schedules"], // Step03: 스케줄 시간
    // 필요 시 더 추가
  };

  const handleNext = async () => {
    const fields = stepValidationMap[activeStep];
    if (!fields) {
      nextStep();
      return;
    }
    const ok = await trigger(fields);
    if (ok) {
      nextStep();
    }
  };

  return (
    <div className="flex w-full flex-col shadow-xs">
      <div className="flex items-center justify-between mb-4">
        {/* 왼쪽 버튼 */}
        {isFirstStep ? (
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            className="!text-pilltime-violet font-bold cursor-pointer"
          >
            취소
          </Button>
        ) : (
          <Button
            type="button"
            onClick={previousStep}
            variant="ghost"
            className="!text-pilltime-violet font-bold cursor-pointer"
          >
            이전
          </Button>
        )}

        {/* 타이틀 */}
        <h2 className="text-md font-bold">새로운 약 등록</h2>

        {/* 오른쪽 버튼 */}
        {isLastStep ? (
          <Button
            type="button"
            variant="ghost"
            disabled={isLoading}
            onClick={() =>
              submitBtnRef?.current && submitBtnRef.current?.click()
            }
            className="!text-pilltime-violet font-bold cursor-pointer"
          >
            저장
          </Button>
        ) : returnToStep ? (
          <Button
            type="button"
            onClick={() => {
              const back = popReturnTo();
              goToStep(back ?? stepCount - 1);
            }}
            variant="ghost"
            className="!text-pilltime-violet font-bold cursor-pointer"
          >
            수정
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNext}
            variant="ghost"
            className="!text-pilltime-violet font-bold cursor-pointer"
          >
            다음
          </Button>
        )}
      </div>
    </div>
  );
}
