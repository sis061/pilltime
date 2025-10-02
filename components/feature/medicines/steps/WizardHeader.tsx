"use client";

import { useWizard } from "react-use-wizard";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function WizardHeader({ onClose }: { onClose: () => void }) {
  const { previousStep, nextStep, isFirstStep, isLastStep } = useWizard();

  return (
    <div className="flex w-full flex-col shadow-xs">
      <div className="flex items-center justify-between mb-4">
        {/* 왼쪽 버튼 */}
        {isFirstStep ? (
          <Button
            onClick={onClose}
            variant="ghost"
            className="!text-pilltime-violet font-bold"
          >
            취소
          </Button>
        ) : (
          <Button
            onClick={previousStep}
            variant="ghost"
            className="!text-pilltime-violet font-bold"
          >
            이전
          </Button>
        )}

        {/* 타이틀 */}
        <h2 className="text-md font-bold">새로운 약 등록</h2>

        {/* 오른쪽 버튼 */}
        {isLastStep ? (
          <Button
            type="submit"
            variant="ghost"
            onClick={onClose}
            className="!text-pilltime-violet font-bold"
          >
            저장
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            variant="ghost"
            className="!text-pilltime-violet font-bold"
          >
            다음
          </Button>
        )}
      </div>
    </div>
  );
}
