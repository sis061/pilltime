"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFormContext, useFieldArray } from "react-hook-form";

export function MedicineDescriptionField() {
  const { control, register, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "description",
  });

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold">상세 정보</label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-center">
          <Input
            {...register(`description.${index}.value` as const, {
              onChange: (e) => {
                setValue(`description.${index}.value`, e.target.value, {
                  shouldDirty: true,
                });
              },
            })}
            placeholder="상세 정보를 입력하세요."
            className="!px-2 !border-pilltime-grayLight !mx-1"
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
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="max-w-12 w-full self-center cursor-pointer"
        onClick={() => append({ value: "" })}
      >
        추가
      </Button>
    </div>
  );
}
