"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/util/supabase";

//TODO 전역 상태관리로 로그인 상태 관리
//TODO 내부페이지에 세션 없으면 자동 리다이렉트

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleSession() {
      // Supabase가 리다이렉트 후 URL에 세션 정보를 붙여줌
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("세션 확인 실패:", error.message);
        router.replace("/login");
        return;
      }

      if (data?.session) {
        // 로그인 성공 → 메인 페이지로 이동
        router.replace("/");
        console.log(data);
      } else {
        // 세션 없음 → 다시 로그인 페이지로
        router.replace("/login");
      }
    }

    handleSession();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-pilltime-grayLight">
      <p className="text-pilltime-grayDark text-sm">로그인 처리 중...</p>
    </main>
  );
}
