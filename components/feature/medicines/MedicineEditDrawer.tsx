"use client";

//TODO 캐싱

import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useForm, FormProvider } from "react-hook-form";
import { useEffect, useRef, useState, useTransition } from "react";
import { useMediaQuery } from "react-responsive";
import {
  MedicineNameField,
  MedicineDescriptionField,
  MedicineSchedulesField,
  MedicineImageField,
} from "@/components/feature/medicines/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MedicineSchema, MedicineFormValues } from "@/lib/schemas/medicine";
import { useParams, useRouter } from "next/navigation";
import { deleteMedicineImage } from "@/lib/supabase/upload";
import { useGlobalLoading } from "@/store/useGlobalLoading";
import { toast } from "sonner";
import {
  MedicineSchedule,
  RepeatedPattern,
  UISchedule,
} from "@/types/medicines";
import { toHHMMSS } from "@/lib/date";
import { buildPatch } from "@/lib/medicine";

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

async function deleteMedicine(id: string) {
  const res = await fetch(`/api/medicines/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "약정보 삭제 실패");
  }
  return res.json();
}

export default function MedicineEditDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const { isGLoading, setGLoading } = useGlobalLoading();
  const [isPendingNav, startTransition] = useTransition();
  const { id } = useParams();
  const router = useRouter();
  const minTablet = useMediaQuery({ minWidth: 768 });

  const busy = isGLoading || isPendingNav;

  const methods = useForm<MedicineFormValues>({
    resolver: zodResolver(MedicineSchema),
    defaultValues: {
      name: "",
      description: [{ value: "" }],
      schedules: [{ id: null as any, time: "" } as any],
      repeated_pattern: { type: "DAILY" },
      imageUrl: "/fallback-medicine.png",
      imageFilePath: null,
    },
    mode: "onSubmit",
  });

  const { handleSubmit, formState, reset, getValues } = methods;

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

  // 서버 상태 스냅샷
  const initSchedulesRef = useRef<UISchedule[]>([]);

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
            time: toHHMMSS(s.time),
          })) as any[],
          repeated_pattern: rp,
          imageUrl: data.image_url ?? "/fallback-medicine.png",
          imageFilePath: null,
        });

        initSchedulesRef.current = data.medicine_schedules.map(
          (s: MedicineSchedule) => ({
            id: s.id,
            time: toHHMMSS(s.time),
            repeated_pattern: s.repeated_pattern,
          })
        );

        setOriginalImageUrl(data.image_url ?? null);
      } catch (e) {
        toast.error("정보를 불러오는 중 문제가 발생했어요");
        console.log("e:", e);
      } finally {
        setGLoading(false);
      }
    })();

    return () => ac.abort();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, open, reset]);

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
      setGLoading(true, "수정 중이에요..");
      await updateMedicine(String(id), payload);
      if (originalImageUrl && v.imageUrl !== originalImageUrl) {
        const oldPath = originalImageUrl.split("/medicine-images/")[1];
        if (oldPath) deleteMedicineImage(oldPath).catch(() => {});
      }
      initSchedulesRef.current = next;
      toast.success(`${v.name}의 정보를 수정했어요`);
      startTransition(() => router.refresh());
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "정보를 수정하는 중 문제가 발생했어요");
    } finally {
      setGLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={async (nextOpen) => {
        if (!nextOpen) {
          await handleCancel();
          onOpenChange(false);
          startTransition(() => router.refresh());
        } else onOpenChange(true);
      }}
      direction={minTablet ? "right" : "bottom"}
      repositionInputs={false}
    >
      <DrawerContent className="!p-4 bg-slate-100 max-h-[96dvh] md:max-h-[100dvh] md:w-[480px] md:!ml-auto md:top-0 md:rounded-tr-none md:rounded-bl-[10px]">
        <DrawerHeader className="!pb-4 flex w-full items-center justify-between">
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            disabled={busy}
            className="!pr-2 font-bold !text-pilltime-violet"
          >
            취소
          </Button>
          <DrawerTitle className="text-md">정보 편집</DrawerTitle>
          <Button
            type="submit"
            variant="ghost"
            disabled={busy}
            className={`!pl-1 font-bold !text-pilltime-violet ${
              busy && "opacity-50"
            }`}
            onClick={() => submitBtnRef.current?.click()}
          >
            저장
          </Button>
        </DrawerHeader>

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-8 max-h-[80vh] md:h-screen overflow-y-auto px-2"
          >
            <MedicineImageField />
            <MedicineNameField />
            <MedicineDescriptionField />
            <MedicineSchedulesField />
            <button ref={submitBtnRef} type="submit" className="hidden" />
          </form>
        </FormProvider>

        <DrawerFooter className="flex justify-center !py-8">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                className="!text-red-700 w-full bg-pilltime-grayDark/25"
              >
                정보 삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-pilltime-grayLight !p-4">
              <AlertDialogHeader>
                <AlertDialogTitle>정말 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  약과 관련된 모든 정보가 삭제됩니다!
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex gap-2 !px-12 sm:!px-0">
                <AlertDialogCancel className="!py-2 !px-4" disabled={busy}>
                  취소
                </AlertDialogCancel>
                <AlertDialogAction
                  className="!py-2 !px-4 bg-red-500 !text-white"
                  onClick={async () => {
                    try {
                      await deleteMedicine(String(id));
                      toast.success("정보를 삭제했어요");
                      startTransition(() => {
                        router.push("/");
                        router.refresh();
                        onOpenChange(false);
                      });
                    } catch (err: any) {
                      toast.error("정보를 삭제하는 중 문제가 발생했어요");
                    }
                  }}
                  disabled={busy}
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
