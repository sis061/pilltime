"use client";

import fallbackImg from "@/public/fallback-medicine.webp";
// ---- REACT
import { useCallback, useRef, useState } from "react";
// ---- NEXT
import Image from "next/image";
import { usePathname } from "next/navigation";
// ---- UI
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
// ---- UTIL
import { uploadMedicineImage } from "@/lib/supabase/upload";
import ImageUploader from "../ImageUploader";
// ---- LIB
import { useFormContext } from "react-hook-form";
// ---- STORE
import { useUserStore } from "@/store/useUserStore";
// ---- CUSTOM HOOKS
import { useSSRMediaquery } from "@/lib/useSSRMediaquery";
import { useGlobalLoading } from "@/store/useGlobalLoading";
import SmartImage from "@/components/layout/SmartImage";

export function MedicineImageField() {
  const user = useUserStore((s) => s.user);

  const pathname = usePathname();
  const isPathnameNew = pathname.includes("new");

  const minTablet = useSSRMediaquery(768);
  const { isGLoading, setGLoading } = useGlobalLoading();

  const { watch, setValue } = useFormContext();
  const imageUrl = watch("imageUrl");

  // const imageFilePath = watch("imageFilePath");

  // ✅ 서브 Drawer 상태

  const [cropOpen, setCropOpen] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ✅ 파일 선택 핸들러 (변경 버튼 눌렀을 때)
  const handleSelectFile = () => {
    if (uploading) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        setRawFile(file);
        setCropOpen(true); // ✅ 파일 선택 후 서브 Drawer 오픈
      }
    };
    input.click();
  };

  const lastBlobUrlRef = useRef<string | null>(null); // revoke용

  const handleCroppedImage = useCallback(
    async (croppedFile: File | Blob, localPreviewUrl?: string | null) => {
      if (!user) {
        toast.error("로그인이 필요해요");
        return;
      }

      // 1) 프리뷰를 곧장 imageUrl에 넣기 (optimistic)
      if (localPreviewUrl) {
        // 이전 Blob URL 정리
        if (lastBlobUrlRef.current) URL.revokeObjectURL(lastBlobUrlRef.current);
        lastBlobUrlRef.current = localPreviewUrl;

        setValue("imageUrl", localPreviewUrl, { shouldDirty: true }); // ✅ 프리뷰도 imageUrl 사용
      }

      try {
        setGLoading(true, "이미지 업로드 중이에요...");
        setUploading(true);

        // 2) 업로드
        const { publicUrl, filePath } = await uploadMedicineImage(
          croppedFile,
          user.id
        );
        setValue("imageFilePath", filePath, { shouldDirty: true });

        // 3) prefetch 후 같은 필드를 최종 URL로 교체
        await new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            setValue("imageUrl", publicUrl, { shouldDirty: true }); // ✅ 같은 필드 교체
            // 프리뷰 Blob 정리
            if (lastBlobUrlRef.current) {
              URL.revokeObjectURL(lastBlobUrlRef.current);
              lastBlobUrlRef.current = null;
            }
            resolve();
          };
          img.onerror = () => reject(new Error("원격 이미지 로딩 실패"));
          img.src = publicUrl;
        });
      } catch (err: any) {
        // 에러 시 프리뷰 Blob 정리 & 비우기(선택)
        if (lastBlobUrlRef.current) {
          URL.revokeObjectURL(lastBlobUrlRef.current);
          lastBlobUrlRef.current = null;
        }
        // 실패했으면 기존 imageUrl을 원상복구하거나 빈 값으로 둘 수도 있음(옵션)
        toast.error(
          "이미지 업로드 중 문제가 발생했어요 " + (err?.message ?? "")
        );
      } finally {
        setUploading(false);
        setCropOpen(false);
        setGLoading(false);
      }
    },
    [user, setValue, setGLoading]
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold">이미지</label>
        <div className="flex flex-col items-center justify-center gap-2">
          <div
            className="w-40 h-40 border !border-pilltime-violet/50 rounded-md overflow-hidden relative"
            onClick={() => {
              if (!uploading) handleSelectFile();
            }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="medicine-preview"
                className="object-cover w-full h-full"
                width={160}
                height={160}
              />
            ) : (
              <SmartImage src={imageUrl} className="rounded-md" />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="max-w-12 w-full self-center cursor-pointer"
            onClick={handleSelectFile}
            disabled={uploading || isGLoading}
          >
            {uploading ? "업로드 중..." : isPathnameNew ? "추가" : "변경"}
          </Button>
        </div>
      </div>
      {/* ✅ 크롭 Drawer */}
      <Drawer
        open={cropOpen}
        onOpenChange={setCropOpen}
        direction={minTablet ? "right" : "bottom"}
        dismissible={false}
      >
        <DrawerContent className="!p-4 bg-white min-h-[92dvh] md:max-h-[100dvh] md:w-[472px] md:!ml-auto md:top-0 md:rounded-tr-none md:rounded-bl-[10px]">
          <DrawerHeader className="grid grid-cols-3 items-center !mb-8">
            <Button
              variant="ghost"
              disabled={isGLoading}
              className="font-bold cursor-pointer !text-pilltime-violet justify-self-start"
              onClick={() => {
                setRawFile(null);
                setCropOpen(false);
              }}
            >
              취소
            </Button>
            <DrawerTitle className="text-center">이미지 편집</DrawerTitle>
            <div />
          </DrawerHeader>

          <ImageUploader file={rawFile} onCropped={handleCroppedImage} />
        </DrawerContent>
      </Drawer>
    </>
  );
}
