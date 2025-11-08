import {
  MedicineNameField,
  MedicineDescriptionField,
  MedicineSchedulesField,
  MedicineImageField,
} from "../form";
import { Button } from "@/components/ui/button";
import { useWizard } from "react-use-wizard";

interface StepConfig {
  id: string;
  title: string;
  subtitle?: string[];
  Component: React.ComponentType;
  onClose?: () => void;
}

export function StepWrapper({
  title,
  subtitle,
  Component,
  onClose,
}: StepConfig) {
  const { isFirstStep } = useWizard();
  return (
    <div className="flex flex-col gap-2 !pb-12 overflow-y-auto h-full relative">
      <div className="!pb-4">
        <h2 className="text-sm font-bold !text-pilltime-grayDark/40">
          {title}
        </h2>
        {subtitle && (
          <div className="flex flex-col gap-1 !pl-1 !pt-2">
            {subtitle?.map((s, i) => (
              <span
                key={i}
                className="text-sm font-bold !text-pilltime-grayDark/30 "
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <Component />
      {!isFirstStep && (
        <div className="absolute bottom-0 right-0">
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            className={`transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110 !text-pilltime-grayDark/50 font-bold`}
          >
            닫기
          </Button>
        </div>
      )}
    </div>
  );
}

export const steps: StepConfig[] = [
  {
    id: "name",
    title: "약 이름을 등록하세요 (필수)",
    Component: MedicineNameField,
  },
  {
    id: "description",
    title: "약과 관련된 짧은 정보를 한줄 씩 기록하세요",
    subtitle: ["예) 하루 두 번, 식후 30분", "예) 물과 함께 섭취할 것"],
    Component: MedicineDescriptionField,
  },
  // {
  //   id: "period",
  //   title: "복용 기간을 입력하세요 (시작일 필수)",
  //   Component: MedicinePeriodField,
  // },
  {
    id: "schedules",
    title: "복용 주기와 시간을 입력하세요 (필수)",
    subtitle: [
      "매일 / 매주 특정 요일 / 매달 1, 10, 20, 30일 중 선택 가능",
      "일일 복용 시간은 자유롭게 추가할 수 있어요",
    ],
    Component: MedicineSchedulesField,
  },
  {
    id: "image",
    title: "이미지를 등록하세요",
    Component: MedicineImageField,
  },
];
