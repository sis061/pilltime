"use client";

import { useEffect, useState } from "react";
import { CircleChevronUp } from "lucide-react";

export default function ScrollTopBtn() {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 150);
    handleScroll(); // 초기 상태 확인
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled]);

  return (
    <button
      className={`
        cursor-pointer rounded-full fixed bottom-6 right-6 z-50 bg-pilltime-grayLight/50 [&_>svg]:stroke-pilltime-violet shadow-md transition-all duration-150 ease-in-out scale-100 touch-manipulation active:scale-95 hover:scale-110
        ${isScrolled ? "visible" : "hidden"}
      `}
      aria-label="Scroll to top"
      onClick={scrollToTop}
    >
      <CircleChevronUp size={36} />
    </button>
  );
}
