"use client";

import { useRef, useTransition, useEffect } from "react";
// ---- NEXT
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
// ---- COMPONENT
import { WizardHeader } from "./steps/WizardHeader";
import { steps, StepWrapper } from "./steps/config";
import { Step05Review } from "@/components/feature/medicines/steps/Step05Review";
// ---- UI
import { toast } from "sonner";
import { PacmanLoader } from "react-spinners";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
// ---- UTIL
import { MedicineSchema, MedicineFormValues } from "@/lib/schemas/medicine";
import { deleteMedicineImage } from "@/lib/supabase/upload";
// ---- LIB
// import { Wizard } from "react-use-wizard";
const Wizard = dynamic(() => import("react-use-wizard").then((m) => m.Wizard), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <PacmanLoader size={20} color="#14B8A6" className="!z-[99] self-center" />
    </div>
  ),
});
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// ---- STORE
import { useGlobalLoading } from "@/store/useGlobalLoading";
import { useSSRMediaquery } from "@/lib/useSSRMediaquery";

async function createMedicine(values: MedicineFormValues) {
  const res = await fetch("/api/medicines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error ?? "Failed to create medicine");
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
  // ---- REACT
  const [isPendingNav, startTransition] = useTransition();
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  // ---- NEXT
  const router = useRouter();
  // ---- CUSTOM HOOKS
  const minTablet = useSSRMediaquery(768);
  // ---- STORE
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

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const busy = isSubmitting || isLoading || isPendingNav;

  useEffect(() => {
    setGLoading(false);
  }, [setGLoading]);

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

  /* ------
   * SUBMIT
   * ------ */

  const onSubmit = async (data: MedicineFormValues) => {
    const sortedSchedules = [...(data.schedules ?? [])].sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    const filteredEmptyDescription =
      data.description &&
      [...data.description].filter((v) => (v.value ?? "").trim()?.length > 0);

    const _data = {
      ...data,
      description: filteredEmptyDescription,
      schedules: sortedSchedules,
    };
    try {
      setGLoading(true, "새로운 약을 등록 중이에요...");
      await createMedicine(_data);

      toast.success(`${_data.name}의 정보를 등록했어요`);

      // 부모(RSC) 최신화 + 닫기
      startTransition(() => {
        router.refresh();
        onOpenChange(false);
      });
    } catch (error) {
      console.log(error);
      toast.error("정보를 등록하는 중 문제가 발생했어요");
    } finally {
      setGLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={async (nextOpen) => {
        if (nextOpen) setGLoading(false);
        if (!nextOpen) {
          // Drawer가 닫힐 때 → 취소 로직 실행
          await handleCancel();
          onOpenChange(false);
          // 혹시 중간까지 입력 후 닫혔던 경우를 대비해 목록 갱신
          startTransition(() => router.refresh());
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
            onSubmit={handleSubmit(onSubmit)}
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
            <button ref={submitBtnRef} type="submit" hidden disabled={busy}>
              저장
            </button>
          </form>
        </FormProvider>
      </DrawerContent>
    </Drawer>
  );
}
