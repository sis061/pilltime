"use client";

import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { useRef, useState } from "react";
import { useMediaQuery } from "react-responsive";
import ImageUploader from "./ImageUploader"; // ✅ 크롭 포함 업로더

import {
  MedicineNameField,
  MedicineDescriptionField,
  MedicineSchedulesField,
  MedicineImageField,
} from "@/components/feature/medicines/form";

export interface MedicineFormValues {
  name: string;
  description?: { value: string }[];
  schedules: { time: string }[];
  imageUrl?: string;
}

export default function MedicineEditDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const methods = useForm<MedicineFormValues>({
    defaultValues: {
      name: "혈압약",
      description: [{ value: "아침 저녁 복용" }],
      schedules: [{ time: "08:00" }],
      imageUrl: "/fallback-medicine.png",
    },
  });

  const onSubmit = (data: MedicineFormValues) => {
    console.log("최종 저장 데이터:", data);
    onOpenChange(false);
  };

  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const minTablet = useMediaQuery({ minWidth: 768 });

  return (
    <>
      {/* 메인 Drawer */}
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        direction={minTablet ? "right" : "bottom"}
        repositionInputs={false}
      >
        <DrawerContent className="!p-4 bg-slate-100 max-h-[96dvh] md:max-h-[100dvh] md:w-[480px] md:!ml-auto md:top-0 md:rounded-tr-none md:rounded-bl-[10px]">
          <DrawerHeader className="!pb-4 flex w-full items-center justify-between">
            <Button
              onClick={() => onOpenChange(false)}
              variant={"ghost"}
              className="!pr-2 font-bold !text-pilltime-violet"
            >
              취소
            </Button>
            <DrawerTitle className="text-md">정보 편집</DrawerTitle>
            <Button
              type="submit"
              variant={"ghost"}
              className="!pl-1 font-bold !text-pilltime-violet"
              onClick={() =>
                submitBtnRef?.current && submitBtnRef.current.click()
              }
            >
              저장
            </Button>
          </DrawerHeader>

          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="flex flex-col gap-8 max-h-[80vh] md:h-screen overflow-y-auto px-2"
            >
              <MedicineImageField />
              <MedicineNameField />
              <MedicineDescriptionField />
              <MedicineSchedulesField />

              <button ref={submitBtnRef} type="submit" className=" hidden">
                저장
              </button>
            </form>
          </FormProvider>
          <DrawerFooter className="flex justify-center !py-8">
            <Button
              type="button"
              variant="destructive"
              className="!text-red-700"
            >
              정보 삭제
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
