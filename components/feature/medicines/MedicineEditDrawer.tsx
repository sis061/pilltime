"use client";

import { useEffect, useRef, useState, useTransition } from "react";

// ---- NEXT
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// ---- COMPONENT
const MedicineNameField = dynamic(
  () =>
    import("@/components/feature/medicines/form").then(
      (m) => m.MedicineNameField
    ),
  { loading: () => <Skeleton className="h-10 w-full" /> }
);
const MedicineDescriptionField = dynamic(
  () =>
    import("@/components/feature/medicines/form").then(
      (m) => m.MedicineDescriptionField
    ),
  { loading: () => <Skeleton className="h-10 w-full" /> }
);
const MedicineSchedulesField = dynamic(
  () =>
    import("@/components/feature/medicines/form").then(
      (m) => m.MedicineSchedulesField
    ),
  { loading: () => <Skeleton className="h-10 w-full" /> }
);
const MedicineImageField = dynamic(
  () =>
    import("@/components/feature/medicines/form").then(
      (m) => m.MedicineImageField
    ),
  { loading: () => <Skeleton className="h-10 w-full" /> }
);
const DeleteMedicineDialog = dynamic(
  () => import("@/components/feature/medicines/DeleteMedicineDialog"),
  {
    ssr: false,
    // 필요하다면 아주 가벼운 미니 스켈레톤
    loading: () => null,
  }
);

// ---- UI
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ---- UTIL
import { zodResolver } from "@hookform/resolvers/zod";
import { MedicineSchema, MedicineFormValues } from "@/lib/schemas/medicine";
import { toHHmm } from "@/lib/date";
import { buildPatch } from "@/lib/medicine";
import { deleteMedicineImage } from "@/lib/supabase/upload";

// ---- LIB
import { useForm, FormProvider } from "react-hook-form";

// ---- STORE
import { useGlobalLoading } from "@/store/useGlobalLoading";

// ---- TYPE
import {
  MedicineSchedule,
  RepeatedPattern,
  UISchedule,
} from "@/types/medicines";
import { useSSRMediaquery } from "@/hooks/useSSRMediaquery";

/* ---------------------------
 * API
 * --------------------------- */

async function fetchMedicine(id: string, signal?: AbortSignal) {
  const res = await fetch(`/api/medicines/${id}`, {
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "약 정보 조회 실패");
  }
  return res.json();
}

async function updateMedicine(id: string, values: any) {
  const res = await fetch(`/api/medicines/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "약 정보 업데이트 실패");
  }
}

export default function MedicineEditDrawer({
  open,
  onOpenChange: parentOnOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // ---- REACT
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const initSchedulesRef = useRef<UISchedule[]>([]); // 서버 상태 스냅샷
  const [isPendingNav, startTransition] = useTransition();

  // ---- NEXT
  const { id } = useParams();
  const router = useRouter();

  // ---- CUSTOM HOOKS
  const minTablet = useSSRMediaquery(768);
  const drawerDir =
    minTablet === null ? "bottom" : minTablet ? "right" : "bottom";

  // ---- STORE
  const { isGLoading, startLoading, stopLoading, forceStop } =
    useGlobalLoading();

  const busy = isGLoading || isPendingNav;

  const methods = useForm<MedicineFormValues>({
    resolver: zodResolver(MedicineSchema),
    defaultValues: {
      name: "",
      description: [{ value: "" }],
      schedules: [{ id: null as any, time: "" } as any],
      repeated_pattern: { type: "DAILY" },
      imageUrl: "",
      imageFilePath: null,
    },
    mode: "onSubmit",
  });

  const { handleSubmit, formState, reset, getValues, watch } = methods;

  // 251104 -- drawer 닫거나 새로고침 시 confirm 추가

  const imageFilePath = watch("imageFilePath");
  const hasUnsavedChanges = formState.isDirty || !!imageFilePath;

  useEffect(() => {
    if (!open || !hasUnsavedChanges) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // 일부 브라우저(iOS 포함)는 커스텀 문구 미지원. returnValue 설정만으로 기본 다이얼로그 표시.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!id || !open) return;
    const ac = new AbortController();

    (async () => {
      try {
        // setGLoading(true, "정보를 불러오는 중이에요..");
        const data = await fetchMedicine(String(id), ac.signal);
        const rp = data.medicine_schedules[0]?.repeated_pattern ?? {
          type: "DAILY",
          tz: "Asia/Seoul",
          days_of_week: [],
          days_of_month: [],
        };
        const sortedSch = [...data.medicine_schedules].sort((a, b) =>
          a.time.localeCompare(b.time)
        );

        reset({
          name: data.name,
          description:
            data.description?.map((d: string) => ({ value: d })) ?? [],
          schedules: sortedSch.map((s: MedicineSchedule) => ({
            id: s.id,
            time: toHHmm(s.time),
          })) as any[],
          repeated_pattern: rp,
          imageUrl: data.image_url ?? "",
          imageFilePath: null,
        });

        initSchedulesRef.current = data.medicine_schedules.map(
          (s: MedicineSchedule) => ({
            id: s.id,
            time: toHHmm(s.time),
            repeated_pattern: s.repeated_pattern,
          })
        );

        setOriginalImageUrl(data.image_url ?? null);
        stopLoading("open-medicine-edit");
      } catch (e) {
        forceStop();
        toast.error("정보를 불러오는 중 문제가 발생했어요");
        console.log("e:", e);
      }
    })();

    return () => ac.abort();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, open, reset]);

  /* ------
 function
------ */

  // supabase storage 에 orphan 파일 삭제용
  async function handleCancel() {
    const filePath = methods.getValues("imageFilePath");
    const imageUrl = methods.getValues("imageUrl");
    // 조건: 새 업로드는 있지만 DB 원본과 다를 때만 삭제
    const isImageDirty =
      !!methods.formState.dirtyFields?.imageUrl ||
      imageUrl !== originalImageUrl;
    if (filePath && isImageDirty) {
      try {
        await deleteMedicineImage(filePath);
        console.log("orphan deleted:", filePath);
      } catch (e) {
        console.error("이미지 삭제 실패:", e);
      }
    }
  }

  const makeMedPatch = (v: MedicineFormValues) => {
    const df = formState.dirtyFields;
    const patch: any = {};
    if (df.name) patch.name = v.name;
    if (df.description)
      patch.description = (v.description ?? [])
        .map((x) => (x.value ?? "").trim())
        .filter(Boolean)
        .map((value) => ({ value }));
    if (df.imageUrl) patch.imageUrl = v.imageUrl ?? null;
    return patch;
  };

  /* ------
   * SUBMIT
   * ------ */

  const onSubmit = async (v: MedicineFormValues) => {
    const rp: RepeatedPattern = (v.repeated_pattern as any) ?? {
      type: "DAILY",
      tz: "Asia/Seoul",
      days_of_week: [],
      days_of_month: [],
    };
    const next: UISchedule[] = (getValues("schedules") ?? []).map((s: any) => ({
      id: s.id ?? null,
      time: s.time,
      repeated_pattern: rp,
    }));
    const schedules_patch = buildPatch(initSchedulesRef.current, next);
    const payload = {
      ...makeMedPatch(v),
      repeated_pattern: rp,
      schedules_changed: !!schedules_patch,
      schedules_patch,
    };
    try {
      startLoading("fetch-medicine-edit", "수정 중이에요..");
      await updateMedicine(String(id), payload);
      reset(v, { keepValues: true });
      if (originalImageUrl && v.imageUrl !== originalImageUrl) {
        const oldPath = originalImageUrl.split("/medicine-images/")[1];
        if (oldPath) deleteMedicineImage(oldPath).catch(() => {});
      }
      initSchedulesRef.current = next;
      toast.success(`${v.name}의 정보를 수정했어요`);
      startTransition(() => router.refresh());
      parentOnOpenChange(false);
      stopLoading("fetch-medicine-edit");
    } catch (err: any) {
      forceStop();
      toast.error(err?.message ?? "정보를 수정하는 중 문제가 발생했어요");
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={async (nextOpen) => {
        if (!nextOpen) {
          if (hasUnsavedChanges) {
            const ok = window.confirm(
              "변경사항이 저장되지 않았어요. 닫을까요?"
            );
            if (!ok) {
              queueMicrotask(() => parentOnOpenChange(true));
              return;
            } // 닫기 취소
          }
          await handleCancel();
          parentOnOpenChange(false);
          startTransition(() => router.refresh());
        } else parentOnOpenChange(true);
      }}
      direction={drawerDir as any}
      repositionInputs={false}
      dismissible={!hasUnsavedChanges}
    >
      <DrawerContent className="!p-4 bg-slate-100 max-h-[96dvh] md:max-h-[100dvh] md:w-[480px] md:!ml-auto md:top-0 md:rounded-tr-none md:rounded-bl-[10px]">
        <DrawerHeader className="!pb-4 flex w-full items-center justify-between">
          <Button
            onClick={() => {
              if (busy) return;
              if (hasUnsavedChanges) {
                const ok = window.confirm(
                  "변경사항이 저장되지 않았어요. 닫을까요?"
                );
                if (!ok) return;
              }
              parentOnOpenChange(false);
            }}
            variant="ghost"
            disabled={busy}
            className="!pr-2 font-bold !text-pilltime-violet transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110"
          >
            취소
          </Button>
          <DrawerTitle className="text-base">약 정보 편집</DrawerTitle>
          <Button
            type="submit"
            variant="ghost"
            disabled={busy || !formState.isDirty}
            className={`!pl-1 font-bold !text-pilltime-violet  transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110 ${
              (busy || !formState.isDirty) && "opacity-50"
            }`}
            onClick={() => submitBtnRef.current?.click()}
          >
            저장
          </Button>
        </DrawerHeader>

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-8 max-h-[96dvh] md:h-screen overflow-y-auto px-2"
          >
            <MedicineImageField />
            <MedicineNameField />
            <MedicineDescriptionField />
            <MedicineSchedulesField />
            <button ref={submitBtnRef} type="submit" className="hidden" />
          </form>
        </FormProvider>

        <DrawerFooter className="flex justify-center !py-8">
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            className="!text-red-700 w-full bg-pilltime-grayDark/25 cursor-pointer"
            onClick={() => setDeleteOpen(true)}
          >
            약 삭제
          </Button>
        </DrawerFooter>
        {deleteOpen && (
          <DeleteMedicineDialog
            id={String(id)}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            disabled={busy}
            onDeleted={() => {
              parentOnOpenChange(false);
              startTransition(() => router.refresh());
            }}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
