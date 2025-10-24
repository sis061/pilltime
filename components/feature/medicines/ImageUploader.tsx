"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ReactCrop, { PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useGlobalLoading } from "@/store/useGlobalLoading";
import { toast } from "sonner";
import { dataURLToBlob, revokeObjectURL, toObjectURL } from "@/lib/image";
// import imageCompression from "browser-image-compression";
interface Props {
  file: File | null;
  onCropped: (cropped: File | Blob, previewUrl: string) => void;
}

// 동적 import + 1회 캐시
let _imgCompPromise: Promise<
  typeof import("browser-image-compression")["default"]
> | null = null;

async function getImageCompression() {
  if (!_imgCompPromise) {
    _imgCompPromise = import("browser-image-compression").then(
      (m) => m.default
    );
  }
  return _imgCompPromise;
}

export default function ImageUploader({ file, onCropped }: Props) {
  const { isGLoading, startLoading, forceStop } = useGlobalLoading();
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<PercentCrop>({
    unit: "%",
    x: 25,
    y: 25,
    width: 50,
    height: 50,
  });
  const imgRef = useRef<HTMLImageElement | null>(null);

  // 파일이 들어오면 미리보기 생성
  useEffect(() => {
    if (file) {
      const url = toObjectURL(file);
      setSrc(url);
      return () => revokeObjectURL(url);
    }
  }, [file]);

  // 이미지 로드 시 정방형 crop 자동 설정
  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const size = Math.min(naturalWidth, naturalHeight);
    const x = (naturalWidth - size) / 2;
    const y = (naturalHeight - size) / 2;

    setCrop({
      unit: "%",
      x: (x / naturalWidth) * 100,
      y: (y / naturalHeight) * 100,
      width: (size / naturalWidth) * 100,
      height: (size / naturalHeight) * 100,
    });
  }

  // 크롭된 Blob 생성
  async function getCroppedBlob(): Promise<Blob | null> {
    const image = imgRef.current;
    if (!image) return null;

    const naturalW = image.naturalWidth;
    const naturalH = image.naturalHeight;

    const px = {
      x: Math.round((crop.x / 100) * naturalW),
      y: Math.round((crop.y / 100) * naturalH),
      w: Math.round((crop.width / 100) * naturalW),
      h: Math.round((crop.height / 100) * naturalH),
    };

    if (px.w <= 0 || px.h <= 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = px.w;
    canvas.height = px.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(image, px.x, px.y, px.w, px.h, 0, 0, px.w, px.h);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) return resolve(blob);
          // Safari 등에서 null이면 dataURL → Blob 폴백
          try {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
            const b = dataURLToBlob(dataUrl);
            resolve(b);
          } catch {
            resolve(null);
          }
        },
        "image/jpeg",
        0.95
      );
    });
  }

  async function handleCropAndUpload() {
    startLoading("upload-image", "이미지를 처리 중이에요..");
    try {
      const blob = await getCroppedBlob();
      if (!blob) return;

      // iOS 탐지
      const isIOS =
        typeof navigator !== "undefined" &&
        /iP(hone|ad|od)/.test(navigator.userAgent);

      const input: Blob = blob;

      let output: Blob = input;
      try {
        const imageCompression = await getImageCompression();
        // ✅ iOS/Safari에선 웹워커 비활성화
        output = await imageCompression(input as any, {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 512,
          useWebWorker: !isIOS && typeof Worker !== "undefined",
        });
      } catch (_) {
        // ✅ 압축 실패하면 원본 그대로 사용 (크래시 방지)
        output = input;
      }

      // 프리뷰 URL
      const previewUrl = toObjectURL(output);

      // 상위 콜백 타입을 Blob도 받도록 수정 권장: (cropped: File|Blob)
      // onCropped(output as File, previewUrl); // <-- 기존이 File만 받는다면 아래처럼 변환 시도

      let maybeFile: File | Blob = output;
      if (typeof File !== "undefined") {
        try {
          // 지원되는 브라우저에서만 File로 감싸기 (이름 필요하면 부여)
          maybeFile = new File([output], `pill-${Date.now()}.jpg`, {
            type: output.type || "image/jpeg",
          });
        } catch {
          // iOS 구형 등 File 생성 실패 → Blob 유지
          maybeFile = output;
        }
      }

      // 이제 상위 콜백으로 전달 (타입을 File | Blob 로 바꾸는 걸 추천)
      // 콜백 시그니처를 onCropped: (fileOrBlob: File|Blob, previewUrl: string) 로 교체
      // 임시로 기존 타입 유지해야 한다면 any 캐스팅:
      onCropped(maybeFile as File, previewUrl);
    } catch (error: any) {
      forceStop();
      console.error("error 발생 - CropAndUpload", error);
      toast.error("이미지 처리 중 문제가 발생했어요 " + error?.message);
    }
  }

  if (!file || !src) {
    return (
      <div className="text-center text-sm text-gray-500 py-12">
        선택된 이미지가 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="max-h-[60vh] overflow-auto">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          aspect={1} // ✅ 정방형
          keepSelection
        >
          <img
            src={src}
            alt="crop-target"
            ref={imgRef}
            onLoad={handleImageLoad}
            className="object-contain mx-auto max-h-[60vh]" // ✅ 원래 스타일 유지
            style={{ imageOrientation: "from-image" as any }} // 지원 브라우저에서 EXIF 반영 힌트
          />
        </ReactCrop>
      </div>

      <div className="flex justify-end gap-2 absolute top-6 right-4">
        <Button
          type="button"
          variant={"ghost"}
          disabled={isGLoading}
          onClick={handleCropAndUpload}
          className="font-bold !text-pilltime-violet cursor-pointer"
        >
          완료
        </Button>
      </div>
    </div>
  );
}
