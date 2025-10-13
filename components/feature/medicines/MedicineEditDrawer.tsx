"use client";

//TODO 로딩 컴포넌트 구현
//TODO 캐싱

import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

import { useForm, FormProvider } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
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
import { deleteMedicineImage } from "@/utils/supabase/upload";

async function fetchMedicine(id: string) {
  const res = await fetch(`/api/medicines/${id}`);
  if (!res.ok) throw new Error("Failed to fetch medicine");
  return res.json();
}

async function updateMedicine(id: string, values: any) {
  const res = await fetch(`/api/medicines/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
}

async function deleteMedicine(id: string) {
  const res = await fetch(`/api/medicines/${id}`, { method: "DELETE" });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
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
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const minTablet = useMediaQuery({ minWidth: 768 });
  const router = useRouter();
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  console.log(loading);

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

  useEffect(() => {
    if (!id || !open) return;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchMedicine(String(id));

        // ✅ react-hook-form 값 업데이트
        methods.reset({
          name: data.name,
          description:
            data.description?.map((d: string) => ({ value: d })) ?? [],
          schedules: data.medicine_schedules?.map((s: any) => ({
            time: s.time,
          })) ?? [{ time: "" }],
          repeated_pattern: data.medicine_schedules?.[0]?.repeated_pattern ?? {
            type: "DAILY",
          },
          imageUrl: data.image_url,
          imageFilePath: null,
        });
        setOriginalImageUrl(data.image_url ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, open, methods.reset]);

  const onSubmit = async (data: MedicineFormValues) => {
    const sortedSchedules = [...(data.schedules ?? [])].sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    const _data = {
      ...data,
      schedules: sortedSchedules,
    };
    console.log("최종 수정 데이터:", _data);
    try {
      await updateMedicine(String(id), _data);

      // ✅ 이미지가 변경되었을 경우 storage에서 이전 이미지 삭제
      if (
        originalImageUrl && // DB에 원래 있던 이미지가 있고
        data.imageUrl !== originalImageUrl // 새 이미지와 다르다면
      ) {
        // storage object path 추출
        const oldPath = originalImageUrl.split("/medicine-images/")[1];
        if (oldPath) {
          try {
            await deleteMedicineImage(oldPath);
            console.log("이전 이미지 삭제 완료:", oldPath);
          } catch (err) {
            console.error("이전 이미지 삭제 실패:", err);
          }
        }
      }

      onOpenChange(false);
    } catch (err: any) {
      console.log(err.message);
    }
  };

  // if (loading) {
  //   return (
  //     <Drawer open={open} onOpenChange={onOpenChange}>
  //       <DrawerContent>
  //         <div className="p-8 text-center !bg-white">불러오는 중...</div>
  //       </DrawerContent>
  //     </Drawer>
  //   );
  // }

  return (
    <>
      {/* 메인 Drawer */}
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
              onClick={async () => {
                if (!confirm("정말 삭제하시겠습니까?")) return;
                await deleteMedicine(String(id));
                router.push("/");
                onOpenChange(false);
              }}
            >
              정보 삭제
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
