"use client";

// ---- REACT
import { useCallback, useRef, useState } from "react";

// ---- NEXT
import dynamic from "next/dynamic";
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
import { Skeleton } from "@/components/ui/skeleton";

// ---- UTIL
import { uploadMedicineImage } from "@/lib/supabase/upload";
const ImageUploader = dynamic(() => import("../ImageUploader"), {
  loading: () => <Skeleton className="h-40" />,
});
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
  const pickLockRef = useRef(false); // 더블 트리거 방지

  const pathname = usePathname();
  const isPathnameNew = pathname.includes("new");

  const minTablet = useSSRMediaquery(768);
  const { isGLoading, startLoading, stopLoading, forceStop } =
    useGlobalLoading();

  const { watch, setValue } = useFormContext();
  const imageUrl = watch("imageUrl");

  //  서브 Drawer 상태

  const [cropOpen, setCropOpen] = useState(false);
  const [rawFile, setRawFile] = useState<File | Blob | null>(null);
  const [uploading, setUploading] = useState(false);

  //  파일 선택 핸들러 (변경 버튼 눌렀을 때)
  const handleSelectFile = () => {
    if (uploading || pickLockRef.current) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.heic,.heif";
    input.multiple = false;

    // iOS 안정성 ↑: DOM에 붙였다가 사용 후 제거 (일부 환경에서 비DOM 인풋이 간헐 실패)
    input.style.position = "fixed";
    input.style.top = "-9999px";
    document.body.appendChild(input);

    input.onchange = async (e: any) => {
      const file: File | undefined = e.target.files?.[0];
      if (!file) {
        toast.error("이미지를 열 수 없어요. 다시 시도해주세요.");
        document.body.removeChild(input);
        return;
      }

      // 더블 트리거 잠금
      if (pickLockRef.current) {
        document.body.removeChild(input);
        return;
      }
      pickLockRef.current = true;

      try {
        startLoading("prepare-image", "이미지를 불러오는 중이에요..");

        //  iCloud 0바이트 대기 루프 (최대 2.5초)
        let tries = 0;
        while (file.size === 0 && tries < 25) {
          await new Promise((r) => setTimeout(r, 100));
          tries++;
        }
        if (file.size === 0) {
          throw new Error(
            "사진 원본이 기기에 아직 내려오지 않았어요. 사진 앱에서 원본을 내려받은 뒤 다시 선택해주세요."
          );
        }

        // 포커스 경합 방지 위한 순서 변경 => 먼저 드로어를 열고, 다음 틱에 변환 시작
        setCropOpen(true);
        await new Promise(requestAnimationFrame);

        const preparedBlob = await preparePickedFile(file); // ← 핵심 전처리
        setRawFile(preparedBlob);
        stopLoading("prepare-image");
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.message ?? "이미지를 열 수 없어요. 다른 사진으로 시도해주세요."
        );
        forceStop();
        setCropOpen(false);
      } finally {
        // 정리
        pickLockRef.current = false;
        // iOS 안정성 ↑: 사용 후 반드시 제거
        document.body.removeChild(input);
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
      {/*  크롭 Drawer */}
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
            <DrawerTitle className="text-center text-base">
              이미지 편집
            </DrawerTitle>
            <div />
          </DrawerHeader>

          <ImageUploader file={rawFile as any} onCropped={handleCroppedImage} />
        </DrawerContent>
      </Drawer>
    </>
  );
}
