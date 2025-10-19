"use client";

import { useEffect, useState } from "react";
// ---- NEXT
import { useRouter } from "next/navigation";
// ---- COMPONENT
import ProfileDrawer from "./ProfileDrawer";
import { SmartButtonGroup } from "./SmartButtons";
import NicknameDrawer from "@/components/feature/profiles/NicknameDrawer";
// ---- UI
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  CalendarSearch,
  LogOut,
  Menu,
  Plus,
  UserCog,
  UserPen,
} from "lucide-react";
// ---- UTIL
import { toYYYYMMDD } from "@/lib/date";
// ---- LIB
import { useMediaQuery } from "react-responsive";
// ---- STORE
import { useUserStore } from "@/store/useUserStore";
import { useGlobalLoading } from "@/store/useGlobalLoading";
// ---- TYPE
import type { User } from "@supabase/supabase-js";

export default function HeaderClient({
  user,
  nickname,
}: {
  user: User | null;
  nickname: string | null;
}) {
  // ---- REACT
  const [openNickname, setOpenNickname] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // ---- NEXT
  const router = useRouter();
  // ---- LIB
  const minMobile = useMediaQuery({ minWidth: 600 });
  // ---- STORE
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const setGLoading = useGlobalLoading((s) => s.setGLoading);

  // 오늘 날짜 계산
  // const today = new Date();
  // const y = today.getFullYear();
  // const m = String(today.getMonth() + 1).padStart(2, "0");
  // const d = String(today.getDate()).padStart(2, "0");

  /* ------
   * CONST
   * ------ */

  const todayYmd = toYYYYMMDD(new Date(), "Asia/Seoul");

  /** 공통 버튼 config (props로 내려줄 것) */
  const baseWhiteBtn =
    "font-bold cursor-pointer !text-white flex-col !text-xs !p-2 flex";
  const baseBlueBtn =
    "font-bold cursor-pointer !text-pilltime-blue !text-xs !p-2 flex";

  const desktopBtns = [
    {
      id: "create_new_medicine",
      key: "new",
      label: "새로운 약 등록",
      iconLeft: Plus,
      iconColor: "#fff",
      className: baseWhiteBtn,
      onClick: goNewMedicine,
    },
    {
      key: "calendar",
      label: "지난 기록 보기",
      iconColor: "#fff",
      iconLeft: CalendarSearch,
      className: baseWhiteBtn,
      onClick: () => {
        setMenuOpen(false);
        router.push(`/calendar?d=${todayYmd}`);
        setGLoading(true, "정보를 불러오는 중이에요..");
      },
    },
  ];

  const menuBtns = [
    {
      key: "edit",
      label: "프로필 편집",
      iconLeft: UserPen,
      className: baseBlueBtn,
      onClick: () => setOpenNickname(true),
    },
    {
      key: "logout",
      label: "로그아웃",
      iconLeft: LogOut,
      className: baseBlueBtn,
      onClick: logout,
    },
  ];

  // 모바일용 버튼
  const drawerBtns = desktopBtns.map((b) => ({
    ...b,
    iconColor: "#3B82F6",
    className: baseBlueBtn
      .replace("!text-white", "!text-pilltime-blue")
      .replace("!text-xs", "!text-sm"),
  }));

  /* ------
   * function
   * ------ */

  async function getSupabase() {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  }

  async function logout() {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    clearUser();
    router.replace("/login");
  }

  function goNewMedicine() {
    setMenuOpen(false);
    router.push("/medicines/new");
    setGLoading(true, "정보를 불러오는 중이에요..");
  }

  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        email: user.email ?? null,
        nickname: nickname ?? null,
      });
    } else {
      clearUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, nickname]);

  if (!minMobile)
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => setMenuOpen(true)}
          className="!text-white !p-2 flex-col text-xs"
        >
          <Menu className="h-6 w-6" color="#fff" />
        </Button>
        <ProfileDrawer
          open={menuOpen}
          onOpenChange={setMenuOpen}
          logout={logout}
          openNickname={() => setOpenNickname(true)}
          buttons={drawerBtns}
          menuButtons={menuBtns}
        />
        <NicknameDrawer
          open={openNickname}
          onOpenChange={setOpenNickname}
          mode="edit"
        />
      </div>
    );

  return (
    <div className="flex items-center gap-2">
      {/* 상단 버튼 그룹 */}
      <SmartButtonGroup items={desktopBtns} />

      {/* 드롭다운 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={baseWhiteBtn}
            aria-haspopup="dialog"
          >
            <UserCog className="h-6 w-6" color="#fff" />
            프로필 관리
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="end"
          className="border-1 bg-white *:text-[16px] !border-pilltime-violet shadow-lg"
        >
          {menuBtns.map(
            ({ key, label, iconLeft: Icon, onClick, className }) => (
              <DropdownMenuItem
                key={key}
                onSelect={(e) => {
                  e.preventDefault();
                  onClick?.();
                }}
                className={`hover:!bg-pilltime-violet/15 ${className}`}
              >
                {Icon ? (
                  <Icon className="!mr-2 h-5 w-5" color="#3B82F6" />
                ) : null}
                {label}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <NicknameDrawer
        open={openNickname}
        onOpenChange={setOpenNickname}
        mode="edit"
      />
    </div>
  );
}
