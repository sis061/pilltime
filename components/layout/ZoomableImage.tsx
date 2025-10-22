"use client";

// ---- REACT
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
// ---- NEXT
import Image, { type ImageProps as NextImageProps } from "next/image";
import dynamic from "next/dynamic";
// ---- COMPONENT
//  모달용 컴포넌트만 framer-motion과 함께 동적 로드
import SmartImage, { SmartImageProps } from "./SmartImage";
const MotionOverlay = dynamic(
  () => import("./MotionOverlay").then((m) => m.MotionOverlay),
  { ssr: false }
);
// ---- UI
import { Skeleton } from "@/components/ui/skeleton";

type ZoomableImageProps = Omit<SmartImageProps, "onClick"> & {
  zoomable?: boolean;
  className?: string;
};

export function ZoomableImage({
  zoomable = true,
  className,
  src,
  alt,
  width,
  height,
  onError,
  ...rest
}: ZoomableImageProps) {
  // const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const stringSrc = useMemo(
    () => (typeof src === "string" ? src : (src as any)?.src ?? ""),
    [src]
  );

  useEffect(() => setMounted(true), []);

  // if (hasError) {
  //   return (
  //     <Skeleton
  //       className={`w-full h-full rounded-none bg-[#333] ${className ?? ""}`}
  //     />
  //   );
  // }

  return (
    <>
      <SmartImage
        src={src}
        alt={alt ?? ""}
        width={width}
        height={height}
        onClick={() => zoomable && setIsZoomed(true)}
        // onError={(e) => {
        //   setHasError(true);
        //   onError?.(e);
        // }}
        className={`${zoomable ? "cursor-zoom-in" : ""} ${
          className ?? ""
        } aspect-square`}
        {...rest}
      />

      {mounted &&
        isZoomed &&
        createPortal(
          <MotionOverlay // 모달을 여는 순간 framer-motion 로드
            src={stringSrc}
            alt={alt ?? ""}
            onClose={() => setIsZoomed(false)}
          />,
          document.body
        )}
    </>
  );
}
