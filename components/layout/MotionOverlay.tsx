"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";

export function MotionOverlay({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const prefersReduced = useReducedMotion();
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={
          prefersReduced
            ? { duration: 0 }
            : { duration: 0.2, ease: "easeInOut" }
        }
        onClick={onClose}
        className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 md:p-10"
        role="dialog"
        aria-modal="true"
        aria-label={alt}
      >
        <button
          aria-label="닫기"
          className="absolute top-4 right-4 p-1 cursor-pointer"
          onClick={onClose}
        >
          <X size={20} color="#fff" />
        </button>
        <motion.div
          key="zoomed-wrapper"
          initial={{ scale: prefersReduced ? 1 : 0.98, opacity: 1 }}
          animate={{ scale: 1 }}
          exit={{ scale: prefersReduced ? 1 : 0.98, opacity: 0 }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.12 }}
          className="relative w-full h-full max-w-[min(95vw,1100px)] max-h-[90vh]"
          // onClick={(e) => e.stopPropagation()}
          onClick={onClose}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="100vw"
            priority
            className="object-contain select-none"
            draggable={false}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
