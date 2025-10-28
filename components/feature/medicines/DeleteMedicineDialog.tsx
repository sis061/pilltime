"use client";

import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useGlobalLoading } from "@/store/useGlobalLoading";

async function deleteMedicine(id: string) {
  const res = await fetch(`/api/medicines/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "약정보 삭제 실패");
  }
  return res.json();
}

type Props = {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onDeleted?: () => void;
};

export default function DeleteMedicineDialog({
  id,
  open,
  onOpenChange,
  disabled,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { isGLoading, startLoading, stopLoading, forceStop } =
    useGlobalLoading();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-pilltime-grayLight !p-4 !rounded-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 w-full justify-center">
            <TriangleAlert size={20} />
            <AlertDialogTitle className="!text-pilltime-grayDark/90">
              정말 삭제할까요?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="!text-pilltime-grayDark/50 !pt-4 text-center">
            약과 관련된 모든 정보가 삭제됩니다!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 !px-12 sm:!px-0">
          <AlertDialogAction
            className="!py-2 !px-4 bg-red-500 !text-white transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110"
            disabled={disabled || pending || isGLoading}
            onClick={async () => {
              try {
                startLoading("delete-medicine", "삭제 중이에요..");
                await deleteMedicine(String(id));
                toast.success("정보를 삭제했어요");

                onOpenChange(false);
                onDeleted?.();

                startTransition(() => {
                  router.push("/");
                  router.refresh();
                });
                stopLoading("delete-medicine");
              } catch {
                forceStop();
                toast.error("정보를 삭제하는 중 문제가 발생했어요");
              }
            }}
          >
            삭제
          </AlertDialogAction>
          <AlertDialogCancel
            className="!py-2 !px-4 transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110"
            disabled={disabled || pending || isGLoading}
          >
            취소
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
