"use client";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

export function MedicineNameField() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-bold">이름</label>
      <Input
        {...register("name", { required: "필수 항목입니다!" })}
        className="!px-2 !border-pilltime-grayLight w-[98%] !ml-1"
      />
      {errors.name && (
        <span className="text-xs text-red-500">
          {errors.name.message?.toString()}
        </span>
      )}
    </div>
  );
}
