"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image, { type ImageProps as NextImageProps } from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  onError, // Next/Image onError 지원
  ...rest
}: ZoomableImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mounted, setMounted] = useState(false); // SSR 가드

  // SSR → CSR 전환 후 portal 허용
  useEffect(() => setMounted(true), []);

  // 바디 스크롤 잠금
  useEffect(() => {
    if (!isZoomed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) =>
      e.key === "Escape" && setIsZoomed(false);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [isZoomed]);

  // Next/Image의 src는 string | StaticImport → 모달 img에 string 필요
  const stringSrc = typeof src === "string" ? src : (src as any)?.src ?? "";

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
        createPortal(
          <AnimatePresence>
            {isZoomed && !hasError && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                onClick={() => setIsZoomed(false)}
                className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center cursor-zoom-out p-4 md:p-10"
              >
                <button
                  aria-label="닫기"
                  className="absolute top-4 right-4 cursor-pointer"
                  onClick={() => setIsZoomed(false)}
                >
                  <X size={28} color="#fff" />
                </button>

                <motion.img
                  key="zoomed-image"
                  src={stringSrc}
                  alt={alt ?? ""}
                  loading="eager"
                  initial={{ scale: 0.92, opacity: 1 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="max-w-full max-h-full md:h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
