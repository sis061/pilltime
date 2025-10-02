import {
  MedicineNameField,
  MedicineDescriptionField,
  MedicineSchedulesField,
  MedicineImageField,
} from "../form";

interface StepConfig {
  id: string;
  title: string;
  subtitle?: string[];
  Component: React.ComponentType;
}

export function StepWrapper({ title, subtitle, Component }: StepConfig) {
  return (
    <div className="flex flex-col gap-2 !pb-4">
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
  {
    id: "schedules",
    title: "복용 시간을 입력하세요 (필수)",
    Component: MedicineSchedulesField,
  },
  {
    id: "image",
    title: "이미지를 등록하세요",
    Component: MedicineImageField,
  },
];
