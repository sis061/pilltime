"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase OAuth 리다이렉트 후 여기 도착
    // 세션은 MainLayout에서 자동 관리하므로 단순 redirect만
    router.replace("/");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-pilltime-grayLight">
      <p className="text-pilltime-grayDark text-sm">로그인 처리 중...</p>
    </main>
  );
}
