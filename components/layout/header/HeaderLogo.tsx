"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function HeaderLogo() {
  const router = useRouter();
  return (
    <>
      <Image
        src="/pilltime_mark_duotone.svg"
        alt="PillTime 마크"
        width={60}
        height={60}
        className="-rotate-45 transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110"
        priority
        onClick={() => window && window?.location.reload()}
      />
    </>
  );
}
