"use client";

// ---- REACT
import { useCallback, useRef, useState } from "react";
// ---- NEXT
import Image from "next/image";
import { usePathname } from "next/navigation";
// ---- COMPONENT
import SmartImage from "@/components/layout/SmartImage";
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
import { preparePickedFile, revokeObjectURL } from "@/lib/image";
// ---- LIB
import { useFormContext } from "react-hook-form";
// ---- STORE
import { useUserStore } from "@/store/useUserStore";
// ---- CUSTOM HOOKS
import { useSSRMediaquery } from "@/hooks/useSSRMediaquery";
import { useGlobalLoading } from "@/store/useGlobalLoading";

export function MedicineImageField() {
  const user = useUserStore((s) => s.user);
  const lastBlobUrlRef = useRef<string | null>(null); // revoke용

  const pathname = usePathname();
  const isPathnameNew = pathname.includes("new");

  const minTablet = useSSRMediaquery(768);
  const { isGLoading, startLoading, stopLoading, forceStop } =
    useGlobalLoading();

  const { watch, setValue } = useFormContext();
  const imageUrl = watch("imageUrl");

  // ✅ 서브 Drawer 상태

  const [cropOpen, setCropOpen] = useState(false);
  const [rawFile, setRawFile] = useState<File | Blob | null>(null);
  const [uploading, setUploading] = useState(false);

  // ✅ 파일 선택 핸들러 (변경 버튼 눌렀을 때)
  const handleSelectFile = () => {
    if (uploading) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.heic,.heif";
    input.onchange = async (e: any) => {
      const file: File | undefined = e.target.files?.[0];
      if (!file) {
        toast.error("이미지를 열 수 없어요. 다시 시도해주세요.");
        return;
      }

      try {
        startLoading("prepare-image", "이미지를 불러오는 중이에요..");
        const preparedBlob = await preparePickedFile(file); // ← 핵심 전처리
        setRawFile(preparedBlob);
        setCropOpen(true); // 전처리 끝난 후 Drawer 오픈
        stopLoading("prepare-image");
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.message ?? "이미지를 열 수 없어요. 다른 사진으로 시도해주세요."
        );
        forceStop();
      }
    };
    input.click();
  };

  const handleCroppedImage = useCallback(
    async (croppedFile: File | Blob, localPreviewUrl?: string | null) => {
      if (!user) {
        toast.error("로그인이 필요해요");
        return;
      }

      // 1) 프리뷰를 곧장 imageUrl에 넣기 (optimistic)
      if (localPreviewUrl) {
        revokeObjectURL(lastBlobUrlRef.current);
        lastBlobUrlRef.current = localPreviewUrl;
        setValue("imageUrl", localPreviewUrl, { shouldDirty: true });
      }

      try {
        startLoading("upload-image", "이미지를 업로드 중이에요..");
        setUploading(true);

        // 2) 업로드
        const { publicUrl, filePath } = await uploadMedicineImage(
          croppedFile,
          user.id
        );
        setValue("imageFilePath", filePath, { shouldDirty: true });

        // 3) 원격 이미지 사전 로드 후 교체
        await new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            setValue("imageUrl", publicUrl, { shouldDirty: true });
            revokeObjectURL(lastBlobUrlRef.current);
            lastBlobUrlRef.current = null;
            resolve();
          };
          img.onerror = () => reject(new Error("원격 이미지 로딩 실패"));
          img.src = publicUrl;
        });
        stopLoading("upload-image");
      } catch (err: any) {
        revokeObjectURL(lastBlobUrlRef.current);
        lastBlobUrlRef.current = null;
        toast.error(
          "이미지 업로드 중 문제가 발생했어요 " + (err?.message ?? "")
        );
        forceStop();
      } finally {
        setUploading(false);
        setCropOpen(false);
      }
    },
    [user, setValue, startLoading, stopLoading, forceStop]
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold">이미지</label>
        <div className="flex flex-col items-center justify-center gap-2">
          <div
            className="w-40 h-40 border !border-pilltime-violet/50 rounded-md overflow-hidden relative transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-95"
            onClick={() => {
              if (!uploading) handleSelectFile();
            }}
          >
            <SmartImage src={imageUrl} className="rounded-md" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="max-w-12 w-full self-center transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-95"
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
              className="font-bold !text-pilltime-violet justify-self-start transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110"
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

          <ImageUploader file={rawFile as any} onCropped={handleCroppedImage} />
        </DrawerContent>
      </Drawer>
    </>
  );
}
