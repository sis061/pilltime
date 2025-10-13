"use client";

import { useEffect, useState } from "react";
import NicknameDrawer from "@/components/feature/profiles/NicknameDrawer";
import { useUserStore } from "@/store/useUserStore";

interface ProfileSectionProps {
  id: string;
  email?: string;
  nickname?: string | null;
}

export default function HomeProfile({
  initialUser,
}: {
  initialUser: ProfileSectionProps;
}) {
  const storedUser = useUserStore((s) => s.user);
  const user = initialUser ?? storedUser;
  // const user = storedUser;
  const [openDrawer, setOpenDrawer] = useState(false);

  useEffect(() => {
    if (user && user.nickname === null) {
      setOpenDrawer(true);
    }
  }, [user?.nickname]);

  if (!user) {
    return (
      <div className="!mb-4 !text-sm text-center">
        <h1>로그인 상태를 불러오는 중...</h1>
      </div>
    );
  }

  return (
    <div className="!mb-12 flex flex-col-reverse md:flex-col items-center max-md:gap-4 justify-center">
      <div className="flex items-center justify-center md:justify-end w-full ">
        <div className="!font-bold flex flex-col items-center md:items-end justify-center [&_h3]:!text-lg [&_span]:!text-sm [&_span]:opacity-75">
          <h3>
            {new Date().getMonth() + 1}
            <span>월</span> {new Date().getDate()}
            <span>일</span>
          </h3>
          <h3>
            {new Date().toLocaleDateString("ko-KR", { weekday: "short" })}
            <span>요일</span>
          </h3>
        </div>
      </div>
      <h1 className="!text-4xl w-full !px-4 text-center max-md:!pt-8">
        안녕하세요{" "}
        {user?.nickname ? (
          <span className="!font-bold !text-pilltime-blue">
            {user.nickname}
          </span>
        ) : (
          "..."
        )}
        님!
      </h1>

      <NicknameDrawer
        open={openDrawer}
        onOpenChange={setOpenDrawer}
        mode={user.nickname ? "edit" : "create"}
      />
    </div>
  );
}
