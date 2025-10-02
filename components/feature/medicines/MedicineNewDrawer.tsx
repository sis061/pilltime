"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { FormProvider, useForm } from "react-hook-form";
import { Wizard, useWizard } from "react-use-wizard";

import { Step05Review } from "@/components/feature/medicines/steps/Step05Review";
import { MedicineFormValues } from "./MedicineEditDrawer";
import { useRef } from "react";
import { useMediaQuery } from "react-responsive";
import { WizardHeader } from "./steps/WizardHeader";
import { steps, StepWrapper } from "./steps/config";

export default function MedicineNewDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const methods = useForm<MedicineFormValues>({
    defaultValues: {
      name: "",
      description: [{ value: "" }],
      schedules: [{ time: "" }],
      imageUrl: "/fallback-medicine.png",
    },
  });

  const onSubmit = (data: MedicineFormValues) => {
    console.log("최종 저장 데이터:", data);
    // 여기서 supabase insert 호출하면 됨
  };

  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const minTablet = useMediaQuery({ minWidth: 768 });
  //   const { nextStep, isFirstStep, isLastStep } = useWizard();

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
              header={<WizardHeader onClose={() => onOpenChange(false)} />}
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
          </form>
        </FormProvider>
      </DrawerContent>
    </Drawer>
  );
}
