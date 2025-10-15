"use client";

import { useGlobalLoading } from "@/store/useGlobalLoading";
import { PacmanLoader } from "react-spinners";

export default function GlobalLoading() {
  const isLoading = useGlobalLoading((s) => s.isGLoading);
  const loadingMsg = useGlobalLoading((s) => s.loadingMessage);

  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm ">
      <div className="w-full h-full grid place-items-center">
        <div className="flex flex-col items-center justify-center gap-2  transition-all duration-150">
          <PacmanLoader size={28} color="#14B8A6" className="!z-[99]" />
          <div className="rounded-xl !px-4 !py-2 text-sm !text-white font-bold">
            {loadingMsg ?? "정보를 불러오고 있어요..."}
          </div>
        </div>
      </div>
    </div>
  );
}
