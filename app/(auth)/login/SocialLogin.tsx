"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

export default function SocialLogin() {
  const supabase = createClient();

  async function handleLogin(provider: "google" | "apple") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
    if (error) alert(error.message);
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={() => handleLogin("google")} className="border-1">
        Google로 로그인
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
