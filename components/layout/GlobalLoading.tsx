"use client";

import { PacmanLoader } from "react-spinners";
import { useGlobalLoading } from "@/store/useGlobalLoading";

export default function GlobalLoading() {
  const { isGLoading, loadingMessage } = useGlobalLoading();

  if (!isGLoading) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm ">
      <div className="w-full h-full grid place-items-center">
        <div className="flex flex-col items-center justify-center gap-2  transition-all duration-150">
          <PacmanLoader size={28} color="#14B8A6" className="!z-[99]" />
          <div className="rounded-xl !px-4 !py-2 text-sm !text-white font-bold">
            {loadingMessage ?? "정보를 불러오고 있어요.."}
          </div>
        </div>
      </div>
    </div>
  );
}
