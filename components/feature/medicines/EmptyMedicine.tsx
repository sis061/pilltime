"use client";

import { CirclePlus } from "lucide-react";

export default function EmptyMedicine() {
  return (
    <div className="!mt-6 text-center w-full">
      <div className="border-2 bg-white border-pilltime-blue/50 rounded-md !px-4 !py-8 flex flex-col gap-4 shadow-md items-center justify-center w-full min-h-[50dvh]">
        <div>
          <p className="text-sm !text-pilltime-grayDark/50 !pb-2 font-bold ">
            아직 등록된 약이 없네요
          </p>
          <p className="text-sm !text-pilltime-grayDark/50 font-bold">
            추가하러 가볼까요?
          </p>
        </div>
        <CirclePlus
          strokeWidth={2}
          size={48}
          color="#3b82f6"
          className="cursor-pointer hover:stroke-pilltime-violet duration-200 transition-all"
          onClick={() =>
            document.getElementById("create_new_medicine")?.click()
          }
        />
      </div>
    </div>
  );
}
