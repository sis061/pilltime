//TODO 가이드 라우터 만들기

import "@ant-design/v5-patch-for-react-19";

import dynamic from "next/dynamic";
import type { Metadata } from "next";
const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  {
    loading: () => null,
  }
);

import localFont from "next/font/local";
import "./globals.css";
import { UserProvider } from "@/components/providers/UserProvider";
import GlobalLoading from "@/components/layout/GlobalLoading";
import { OnboardingManager } from "@/components/feature/notifications/OnboardingManager";

const ScrollTopBtn = dynamic(() =>
  import("@/components/layout/ScrollToTop").then((mod) => mod.default)
);

export const metadata: Metadata = {
  title: "아맞다약!",
  description:
    "잊지 말고 약을 챙겨드세요. 기록을 확인하세요. 알람도 보내드려요.",
};

const pretendard = localFont({
  src: [
    {
      path: "../public/fonts/Pretendard-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Pretendard-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable}  antialiased`}>
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="application-name" content="아맞다약!" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/* 설치 환경 힌트 (선택) */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body>
        <UserProvider>{children}</UserProvider>
        {/* {children} */}

        <OnboardingManager />
        <GlobalLoading />
        <Toaster
          position="top-center"
          duration={3000}
          closeButton
          theme="light"
        />
        <ScrollTopBtn />
      </body>
    </html>
  );
}
