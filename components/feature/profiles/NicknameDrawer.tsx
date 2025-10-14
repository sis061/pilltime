"use client";

import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import { useMediaQuery } from "react-responsive";
import { useGlobalLoading } from "@/store/useGlobalLoading";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit"; // 최초 입력 / 수정 모드
}

export default function NicknameDrawer({
  open,
  onOpenChange,
  mode = "edit",
}: Props) {
  const supabase = createClient();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const isLoading = useGlobalLoading((s) => s.isGLoading);
  const setGLoading = useGlobalLoading((s) => s.setGLoading);

  const [nickname, setNickname] = useState(user?.nickname || "");
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const minTablet = useMediaQuery({ minWidth: 768 });

  useEffect(() => {
    if (open) {
      setNickname(user?.nickname || "");
    }
  }, [open, user]);

  // -- 낙관적 업데이트 적용

  async function handleSave() {
    if (!user) return;

    const prevNickname = user.nickname;
    const optimisticUser = { ...user, nickname };

    // 1️⃣ UI 즉시 갱신 (낙관적 업데이트)
    setUser(optimisticUser);
    setGLoading(true, "정보를 수정 중이에요...");

    try {
      // 2️⃣ 서버 업데이트
      // 닉네임 중복 확인
      const { data: duplicate } = await supabase
        .from("profiles")
        .select("id")
        .eq("nickname", nickname)
        .neq("id", user.id)
        .maybeSingle();

      if (duplicate) {
        toast.error("이미 사용 중인 닉네임이에요");
        throw new Error("이미 사용 중인 닉네임이에요");
      }

      // 실제 업데이트
      const { error } = await supabase
        .from("profiles")
        .update({ nickname })
        .eq("id", user.id);

      if (error) {
        toast.error("정보를 수정하는 중 문제가 발생했어요");
        throw error;
      }

      // 3️⃣ 성공 시 — 그대로 유지
      console.log("✅ 프로필 업데이트 성공");
      toast.success(`닉네임을 수정했어요`);

      // 닉네임 최초 생성이라면 다음 단계 자동 진행
      mode === "create" &&
        document.getElementById("create_new_medicine")?.click();
    } catch (err: any) {
      // 4️⃣ 실패 시 — 이전 상태로 롤백
      console.error("❌ 닉네임 업데이트 실패:", err.message);
      toast.error("정보를 수정하는 중 문제가 발생했어요");
      setUser({ ...user, nickname: prevNickname });
    } finally {
      // 5️⃣ 로딩 해제 + 닫기
      setGLoading(false);
      onOpenChange(false);
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={minTablet ? "right" : "bottom"}
      repositionInputs={false}
    >
      <DrawerContent className="!p-4 bg-slate-100 h-[96dvh] max-h-[100dvh] min-h-[95dvh] md:max-h-[100dvh] md:w-[480px] md:!ml-auto md:top-0 md:rounded-tr-none md:rounded-bl-[10px]">
        {/* Header */}
        <DrawerHeader className="!pb-4 flex w-full items-center justify-between">
          <Button
            onClick={() => onOpenChange(false)}
            variant={"ghost"}
            className={`!pr-2 font-bold cursor-pointer  ${
              mode === "create" ? `!text-transparent` : `!text-pilltime-violet`
            } `}
          >
            취소
          </Button>
          <DrawerTitle className="text-md">
            {mode === "create" ? "프로필 생성" : "프로필 편집"}
          </DrawerTitle>
          <Button
            type="submit"
            variant={"ghost"}
            disabled={isLoading}
            className="!pl-1 font-bold !text-pilltime-violet cursor-pointer"
            onClick={() =>
              submitBtnRef?.current && submitBtnRef.current.click()
            }
          >
            저장
          </Button>
        </DrawerHeader>

        {/* Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="flex flex-col gap-8 max-h-[80vh] md:h-screen overflow-y-auto !px-2 !pb-8"
        >
          <div className="!p-2 flex flex-col gap-4">
            {mode === "create" ? (
              <div className="flex flex-col gap-1 !pl-1 !pb-2">
                <span className="text-sm font-bold !text-pilltime-grayDark/50 ">
                  가입을 환영해요!
                </span>
                <span className="text-sm font-bold !text-pilltime-grayDark/50 ">
                  간단한 별명을 먼저 만들어주세요
                </span>
              </div>
            ) : (
              <label className="text-sm font-semibold">닉네임</label>
            )}

            <Input
              value={nickname}
              required
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              autoFocus
              className="!px-2 !border-pilltime-grayLight w-[98%] !ml-1"
            />
          </div>
          <button ref={submitBtnRef} type="submit" className="hidden">
            저장
          </button>
        </form>

        {/* Footer */}
        {/* {mode === "edit" && (
          <DrawerFooter className="flex justify-center !py-8">
            <Button
              type="button"
              variant="destructive"
              className="!text-red-700"
              onClick={() => {
                setNickname("");
                handleSave();
              }}
            >
              닉네임 초기화
            </Button>
          </DrawerFooter>
        )} */}
      </DrawerContent>
    </Drawer>
  );
}
