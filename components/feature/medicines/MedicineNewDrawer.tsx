"use client";

//TODO 헤더는 냅두고 안에 폼만 스크롤되게 해야지

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { FormProvider, useForm } from "react-hook-form";
import { Wizard } from "react-use-wizard";

import { Step05Review } from "@/components/feature/medicines/steps/Step05Review";

import { useRef } from "react";
import { useMediaQuery } from "react-responsive";
import { WizardHeader } from "./steps/WizardHeader";
import { steps, StepWrapper } from "./steps/config";

import { zodResolver } from "@hookform/resolvers/zod";
import { MedicineSchema, MedicineFormValues } from "@/lib/schemas/medicine";

async function createMedicine(values: MedicineFormValues) {
  const res = await fetch("/api/medicines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error);
  }

  return res.json();
}

export default function MedicineNewDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const methods = useForm<MedicineFormValues>({
    resolver: zodResolver(MedicineSchema),
    defaultValues: {
      name: "",
      description: [{ value: "" }],
      schedules: [{ time: "" }],
      repeated_pattern: { type: "DAILY" },
      imageUrl: "/fallback-medicine.png",
    },
  });

  const onSubmit = (data: MedicineFormValues) => {
    const sortedSchedules = [...(data.schedules ?? [])].sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    const _data = {
      ...data,
      schedules: sortedSchedules,
    };
    console.log("최종 저장 데이터:", _data);
    createMedicine(_data);
    onOpenChange(false);
  };

  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const minTablet = useMediaQuery({ minWidth: 768 });

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
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
            className="flex flex-col gap-8 max-h-[80vh] md:h-screen overflow-y-auto px-2"
          >
            <Wizard
              header={
                <WizardHeader
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
            <button ref={submitBtnRef} type="submit" hidden>
              저장
            </button>
          </form>
        </FormProvider>
      </DrawerContent>
    </Drawer>
  );
}
