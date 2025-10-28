"use client";

import PacmanLoader from "react-spinners/PacmanLoader";
import { useGlobalLoading } from "@/store/useGlobalLoading";
import { Button } from "@/components/ui/button";

export default function GlobalLoading() {
  const { isGLoading, loadingMessage, timedOut, forceStop } =
    useGlobalLoading();

  if (!isGLoading) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm ">
      <div className="w-full h-full grid place-items-center">
        <div className="flex flex-col items-center justify-center gap-2  transition-all duration-150">
          <PacmanLoader size={28} color="#14B8A6" className="!z-[99]" />
          <div className="rounded-xl !px-4 !py-2 text-sm !text-white font-bold">
            {loadingMessage ?? "정보를 불러오고 있어요.."}
          </div>
          {timedOut && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                onClick={() => window.location.reload()}
                className="!px-4 !py-2 rounded-lg border-1 !border-pilltime-blue !text-white font-bold active:scale-95 transition-transform cursor-pointer"
              >
                새로고침
              </Button>
              <Button
                onClick={forceStop}
                className="!px-4 !py-2 rounded-lg  !text-white font-bold border-1 border-red-500 active:scale-95 transition-transform cursor-pointer"
              >
                닫기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
