"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PillTime Main Error:", error);
    toast.error("정보를 불러오는 중 문제가 발생했어요.");
  }, [error]);

  return (
    <section className="inner min-h-[calc(100dvh-11.5rem)] flex flex-col items-center justify-center gap-6 !mx-auto !w-full !p-6">
      <div className="rounded-2xl border border-border bg-card shadow-sm p-8 max-w-md text-center">
        <h2 className="text-lg font-semibold mb-3 text-pilltime-grayDark">
          데이터를 불러올 수 없어요
        </h2>
        <p className="text-sm text-pilltime-grayDark/70 leading-relaxed">
          일시적인 문제일 수 있어요. <br />
          잠시 후 다시 시도하거나 새로고침 해주세요.
        </p>
        <Button onClick={() => reset()} className="mt-6">
          다시 시도
        </Button>
      </div>
    </section>
  );
}
