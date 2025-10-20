"use client";

// ---- REACT
import { useState } from "react";
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

export function MedicineImageField() {
  const pathname = usePathname();
  const isPathnameNew = pathname.includes("new");

  const { watch, setValue } = useFormContext();
  const imageUrl = watch("imageUrl");
  const minTablet = useSSRMediaquery(768);
  // const imageFilePath = watch("imageFilePath");

  const user = useUserStore((s) => s.user);

  // ✅ 서브 Drawer 상태
  const [cropOpen, setCropOpen] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ✅ 파일 선택 핸들러 (변경 버튼 눌렀을 때)
  const handleSelectFile = () => {
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

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold">이미지</label>
        <div className="flex flex-col items-center justify-center gap-2">
          {imageUrl && (
            <div
              className="w-40 h-40 border !border-pilltime-violet/50 rounded-md overflow-hidden "
              onClick={() => {
                if (!uploading) handleSelectFile();
              }}
            >
              <Image
                src={imageUrl}
                alt="medicine-preview"
                className="object-cover w-full h-full"
                width={160}
                height={160}
              />
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="max-w-12 w-full self-center cursor-pointer"
            onClick={handleSelectFile}
            disabled={uploading}
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

          <ImageUploader
            file={rawFile}
            onCropped={async (croppedFile) => {
              if (!user) {
                toast.error("로그인이 필요해요");
                return;
              }

              try {
                setUploading(true);
                const { publicUrl, filePath } = await uploadMedicineImage(
                  croppedFile,
                  user.id
                );

                setValue("imageUrl", publicUrl, { shouldDirty: true });
                setValue("imageFilePath", filePath, { shouldDirty: true });
              } catch (err: any) {
                toast.error(
                  "이미지 업로드 중 문제가 발생했어요 " + err.message
                );
              } finally {
                setUploading(false);
                setCropOpen(false);
              }
            }}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
