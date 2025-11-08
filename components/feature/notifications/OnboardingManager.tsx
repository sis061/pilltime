"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NicknameDrawer from "@/components/feature/profiles/NicknameDrawer";
import dynamic from "next/dynamic";

const FirstVisitBanner = dynamic(() => import("./FirstVisitBanner"), {
  ssr: false,
  loading: () => null,
});

const GuideBanner = dynamic(
  () => import("./GuideBanner").then((m) => m.GuideBanner),
  { ssr: false, loading: () => null }
);

import { useUserStore } from "@/store/useUserStore";

/** 온보딩 전체 순서:
 * 1) 닉네임 없으면 NicknameDrawer(create) -> 완료 후 2로
 * 2) 알림 배너(허용 or 나중에) -> 완료 후 3으로
 * 3) 가이드 배너 -> 끝
 */

export function OnboardingManager() {
  const user = useUserStore((s) => s.user);

  const [openNickname, setOpenNickname] = useState(false);
  const [showNotiBanner, setShowNotiBanner] = useState(false);
  const [showGuideBanner, setShowGuideBanner] = useState(false);

  // 환경 체크
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [notiPrompted, setNotiPrompted] = useState<string | null>(null);
  const [guidePrompted, setGuidePrompted] = useState<string | null>(null);

  const [envReady, setEnvReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPermission(
      "Notification" in window ? Notification.permission : "default"
    );
    setNotiPrompted(localStorage.getItem("pt:notiPrompted"));
    setGuidePrompted(localStorage.getItem("pt:guidePrompted"));
    setEnvReady(true);
  }, []);

  const needNickname = useMemo(
    () => Boolean(user && user.nickname === null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, user?.nickname]
  );

  const needNoti = useMemo(() => {
    if (!envReady || !user) return false; // 준비 전엔 false로 고정
    return permission !== "granted" && !notiPrompted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envReady, user?.id, permission, notiPrompted]);

  const needGuide = useMemo(() => {
    if (!envReady || !user) return false;
    return permission !== "granted" && !guidePrompted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envReady, user?.id, permission, guidePrompted]);

  // 최초 진입 분기

  const startedRef = useRef(false);

  useEffect(() => {
    if (!envReady || !user || startedRef.current) return;
    startedRef.current = true;

    if (needNickname) {
      setOpenNickname(true);
      return;
    }
    if (needNoti) {
      setTimeout(() => setShowNotiBanner(true), 300);
      return;
    }
    if (needGuide) {
      setTimeout(() => setShowGuideBanner(true), 300);
    }
  }, [envReady, user, needNickname, needNoti, needGuide]);

  // 1단계 완료 → 2단계로
  const handleNicknameCompleted = () => {
    setOpenNickname(false);
    // 완료 이후에는 그 시점의 needNoti/needGuide를 다시 본다.
    if (permission !== "granted" && !notiPrompted) {
      setTimeout(() => setShowNotiBanner(true), 200);
    } else if (!guidePrompted) {
      setTimeout(() => setShowGuideBanner(true), 400);
    }
  };

  // 2단계 완료 → 3단계로
  const handleNotiCompleted = () => {
    setShowNotiBanner(false);
    setTimeout(() => setShowGuideBanner(true), 200);
  };

  // 3단계 완료 → 종료
  const handleGuideCompleted = () => {
    setShowGuideBanner(false);
  };

  return (
    <>
      {/* 1) 닉네임 드로어 */}
      <NicknameDrawer
        open={openNickname}
        onOpenChange={setOpenNickname}
        mode={needNickname ? "create" : "edit"}
        onCompleted={handleNicknameCompleted}
      />

      {/* 2) 알림 배너 (닉네임 완료 후에만 마운트) */}
      {showNotiBanner && <FirstVisitBanner onCompleted={handleNotiCompleted} />}

      {/* 3) 가이드 배너 */}
      {showGuideBanner && <GuideBanner onCompleted={handleGuideCompleted} />}
    </>
  );
}
