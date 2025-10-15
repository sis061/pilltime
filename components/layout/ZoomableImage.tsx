// components/layout/ZoomableImage.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image, { type ImageProps as NextImageProps } from "next/image";
// [REMOVED] import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic"; // [ADDED]
import { X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// [ADDED] 모달용 컴포넌트만 framer-motion과 함께 동적 로드
const MotionOverlay = dynamic(
  () => import("./MotionOverlay").then((m) => m.MotionOverlay),
  { ssr: false }
);

type ZoomableImageProps = Omit<NextImageProps, "onClick"> & {
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
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const stringSrc = useMemo(
    () => (typeof src === "string" ? src : (src as any)?.src ?? ""),
    [src]
  );

  if (hasError) {
    return (
      <Skeleton
        className={`w-full h-full rounded-none bg-[#333] ${className ?? ""}`}
      />
    );
  }

  return (
    <>
      <Image
        src={src}
        alt={alt ?? ""}
        width={width}
        height={height}
        onClick={() => zoomable && setIsZoomed(true)}
        onError={(e) => {
          setHasError(true);
          onError?.(e);
        }}
        className={`${zoomable ? "cursor-zoom-in" : ""} ${
          className ?? ""
        } aspect-square`}
        {...rest}
      />

      {mounted &&
        isZoomed &&
        createPortal(
          <MotionOverlay // [ADDED] 모달을 여는 순간 framer-motion 로드
            src={stringSrc}
            alt={alt ?? ""}
            onClose={() => setIsZoomed(false)}
          />,
          document.body
        )}
    </>
  );
}
