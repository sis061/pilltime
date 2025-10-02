"use client";
import { Button } from "@/components/ui/button";
import { useFormContext, useFieldArray } from "react-hook-form";

export function MedicineSchedulesField() {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedules",
  });

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold">복용 시간</label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-center">
          <input
            type="time"
            {...register(`schedules.${index}.time` as const, {
              required: true,
            })}
            step={600}
            className="!p-2 border border-slate-100 shadow-sm rounded w-full"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!text-red-500"
            onClick={() => remove(index)}
          >
            삭제
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="max-w-20 w-full self-center"
        onClick={() => append({ time: "" })}
      >
        추가
      </Button>
    </div>
  );
}
