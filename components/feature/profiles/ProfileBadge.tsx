"use client";

import { useEffect } from "react";
import { User } from "@/types/profile";
import { useUserStore } from "@/store/useUserStore";

export default function ProfileBadge({ initialUser }: { initialUser: User }) {
  const { user, setUser } = useUserStore();

  useEffect(() => {
    if (initialUser && (!user || user.id !== initialUser.id)) {
      setUser(initialUser);
    }
  }, [initialUser, user, setUser]);

  const currentUser = user ?? initialUser;

  if (!currentUser) {
    return (
      <div className="bg-pilltime-blue rounded-full flex items-center justify-center !py-2 !px-1.5 shadow-md">
        <span className="!font-bold !text-white text-xs">...</span>
      </div>
    );
  }

  return (
    <div className="bg-pilltime-blue w-8 h-8 rounded-full flex items-center justify-center shadow-md">
      <span
        className={`!font-bold !text-white text-xs ${
          currentUser.nickname && currentUser.nickname.length > 2
            ? "text-[10px]"
            : "text-xs"
        }`}
      >
        {currentUser.nickname ? currentUser.nickname.slice(0, 3) : "..."}
      </span>
    </div>
  );
}
