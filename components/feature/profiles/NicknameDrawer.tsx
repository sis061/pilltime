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
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import { useMediaQuery } from "react-responsive";

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

  const [nickname, setNickname] = useState(user?.nickname || "");
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const minTablet = useMediaQuery({ minWidth: 768 });

  useEffect(() => {
    if (open) {
      setNickname(user?.nickname || "");
    }
  }, [open, user]);

  async function handleSave() {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ nickname })
      .eq("id", user.id);

    if (error) {
      alert("닉네임 저장 실패: " + error.message);
      return;
    }

    setUser({ ...user, nickname });
    onOpenChange(false);
    mode === "create" &&
      document.getElementById("create_new_medicine")?.click();
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
            className={`!pr-2 font-bold  ${
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
            className="!pl-1 font-bold !text-pilltime-violet"
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
