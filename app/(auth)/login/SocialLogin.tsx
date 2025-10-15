"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useGlobalLoading } from "@/store/useGlobalLoading";

export default function SocialLogin() {
  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "apple" | null
  >(null);
  const setGLoading = useGlobalLoading((s) => s.setGLoading);

  async function getSupabase() {
    const { createClient } = await import("@/lib/supabase/client"); // ✅ 지연 로드
    return createClient();
  }

  async function handleLogin(provider: "google" | "apple") {
    try {
      setLoadingProvider(provider);
      setGLoading(true, "로그인 중이에요...");
      const supabase = await getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      });
      if (error) throw error;
    } catch (_error: any) {
      toast.error("로그인 중 문제가 발생했어요");
      setLoadingProvider(null);
      setGLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full relative">
      <Button
        onClick={() => handleLogin("google")}
        disabled={loadingProvider === "google"}
        className="flex items-center justify-center gap-2 rounded-md border border-[#DADCE0] bg-[#f2f2f2] text-[#3C4043] hover:bg-[#F8F9FA] active:bg-[#E8EAED] transition-colors font-medium px-4 py-2 shadow-sm cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="h-5 w-5"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.29 1.45 8.18 2.67l6-5.82C34.46 3.04 29.77 1 24 1 14.84 1 7.02 6.47 3.49 14.17l7.03 5.46C12.33 14.03 17.74 9.5 24 9.5z"
          />
          <path
            fill="#34A853"
            d="M46.5 24.5c0-1.63-.15-3.18-.43-4.68H24v9.08h12.7c-.55 2.98-2.23 5.51-4.76 7.2l7.31 5.67C43.9 38.09 46.5 31.8 46.5 24.5z"
          />
          <path
            fill="#FBBC05"
            d="M10.52 28.63A14.52 14.52 0 0 1 9.5 24c0-1.61.28-3.17.77-4.63l-7.03-5.46A22.96 22.96 0 0 0 1 24c0 3.68.9 7.15 2.49 10.17l7.03-5.54z"
          />
          <path
            fill="#4285F4"
            d="M24 47c6.48 0 11.92-2.13 15.89-5.79l-7.31-5.67c-2.02 1.35-4.63 2.16-7.58 2.16-6.26 0-11.67-4.53-13.48-10.59l-7.03 5.54C7.02 41.53 14.84 47 24 47z"
          />
        </svg>
        Google 계정으로 로그인
      </Button>

      {/* <Button
        onClick={() => handleLogin("apple")}
        className="bg-black !text-white hover:bg-neutral-800"
      >
        Apple로 로그인
      </Button> */}
    </div>
  );
}
