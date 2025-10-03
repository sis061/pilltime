"use client";

import { useEffect, useState } from "react";
import NicknameDrawer from "@/components/feature/profiles/NicknameDrawer";
import { useUserStore } from "@/store/useUserStore";

interface ProfileSectionProps {
  user: { id: string; email?: string; nickname: string };
}

export default function HomeProfile() {
  const user = useUserStore((s) => s.user); // ← 여기서 읽음
  const [openDrawer, setOpenDrawer] = useState(false);

  useEffect(() => {
    if (user && user.nickname === null) {
      setOpenDrawer(true);
    }
  }, [user?.nickname]);

  if (!user) {
    return (
      <div className="mb-6">
        <h1>로그인 상태를 불러오는 중...</h1>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h1>
        안녕하세요,{" "}
        {user?.nickname ? (
          <span className="!font-bold">{user.nickname}</span>
        ) : (
          "..."
        )}{" "}
        님
      </h1>
      <div>
        {new Date().getMonth() + 1}월 {new Date().getDate()}일{" "}
        {new Date().toLocaleDateString("ko-KR", { weekday: "long" })}
      </div>

      <NicknameDrawer
        open={openDrawer}
        onOpenChange={setOpenDrawer}
        mode={user.nickname ? "edit" : "create"}
      />
    </div>
  );
}
