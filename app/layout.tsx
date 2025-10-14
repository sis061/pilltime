//TODO 동적 메타데이터 구현하기

import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

import localFont from "next/font/local";
import "./globals.css";
import { UserProvider } from "@/components/providers/UserProvider";
import GlobalLoading from "@/components/layout/GlobalLoading";

export const metadata: Metadata = {
  title: "PillTime",
  description: "약먹어",
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
      <body>
        <UserProvider>{children}</UserProvider>
        <GlobalLoading />
        <Toaster
          position="top-center"
          duration={3000}
          closeButton
          theme="light"
        />
      </body>
    </html>
  );
}
