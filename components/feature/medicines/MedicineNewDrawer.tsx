"use client";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

import { FormProvider, useForm } from "react-hook-form";
import { Wizard } from "react-use-wizard";

import { Step05Review } from "@/components/feature/medicines/steps/Step05Review";

import { useRef } from "react";
import { useMediaQuery } from "react-responsive";
import { WizardHeader } from "./steps/WizardHeader";
import { steps, StepWrapper } from "./steps/config";

import { zodResolver } from "@hookform/resolvers/zod";
import { MedicineSchema, MedicineFormValues } from "@/lib/schemas/medicine";
import { deleteMedicineImage } from "@/lib/supabase/upload";
import { useGlobalLoading } from "@/store/useGlobalLoading";
import { toast } from "sonner";

async function createMedicine(values: MedicineFormValues) {
  const res = await fetch("/api/medicines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!res.ok) {
    toast.error("정보를 등록하는 중 문제가 발생했어요");
    const error = await res.json();
    throw new Error(error.error);
  }

  toast.success(`${values.name}의 정보를 등록했어요`);
  return res.json();
}

export default function MedicineNewDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isLoading = useGlobalLoading((s) => s.isGLoading);
  const setGLoading = useGlobalLoading((s) => s.setGLoading);
  const methods = useForm<MedicineFormValues>({
    resolver: zodResolver(MedicineSchema),
    defaultValues: {
      name: "",
      description: [{ value: "" }],
      schedules: [{ time: "" }],
      repeated_pattern: { type: "DAILY" },
      imageUrl: "/fallback-medicine.png",
      imageFilePath: null,
    },
  });

  // supabase storage 에 orphan 파일 삭제용
  async function handleCancel() {
    const filePath = methods.getValues("imageFilePath");
    if (filePath) {
      try {
        await deleteMedicineImage(filePath);
      } catch (e) {
        console.error("이미지 삭제 실패:", e);
      }
    }
  }

  const onSubmit = async (data: MedicineFormValues) => {
    const sortedSchedules = [...(data.schedules ?? [])].sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    const filteredEmptyDescription =
      data.description &&
      [...data.description].filter((v) => v.value?.length > 0);

    const _data = {
      ...data,
      description: filteredEmptyDescription,
      schedules: sortedSchedules,
    };
    console.log("최종 저장 데이터:", _data);
    try {
      setGLoading(true, "새로운 약을 등록 중이에요...");
      await createMedicine(_data);
      onOpenChange(false);
    } catch (error) {
      toast.error("정보를 등록하는 중 문제가 발생했어요");
      console.log(error);
    } finally {
      setGLoading(false);
    }
  };

  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const minTablet = useMediaQuery({ minWidth: 768 });

  return (
    <Drawer
      open={open}
      onOpenChange={async (nextOpen) => {
        if (!nextOpen) {
          // Drawer가 닫힐 때 → 취소 로직 실행
          await handleCancel();
          onOpenChange(false);
        } else {
          onOpenChange(true);
        }
      }}
      direction={minTablet ? "right" : "bottom"}
      repositionInputs={false}
    >
      <DrawerContent className="!p-4 bg-slate-100 min-h-[70dvh] max-h-[96dvh] md:max-h-[100dvh] md:w-[480px] md:!ml-auto md:top-0 md:rounded-tr-none md:rounded-bl-[10px]">
        <DrawerTitle className="text-md " hidden>
          새로운 약 등록
        </DrawerTitle>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="flex flex-col gap-8 max-h-[80vh] md:h-screen px-2"
          >
            <Wizard
              header={
                <WizardHeader
                  // onImageUploadCancel={handleCancel}
                  onClose={() => onOpenChange(false)}
                  submitBtnRef={submitBtnRef}
                />
              }
            >
              {steps.map(({ id, title, subtitle, Component }) => (
                <StepWrapper
                  key={id}
                  id={id}
                  title={title}
                  subtitle={subtitle}
                  Component={Component}
                />
              ))}
              <Step05Review />
            </Wizard>
            <button
              ref={submitBtnRef}
              type="submit"
              hidden
              disabled={isLoading}
            >
              저장
            </button>
          </form>
        </FormProvider>
      </DrawerContent>
    </Drawer>
  );
}
