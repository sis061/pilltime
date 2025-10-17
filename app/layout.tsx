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
const ScrollTopBtn = dynamic(() =>
  import("@/components/layout/ScrollToTop").then((mod) => mod.default)
);

//TODO 동적 메타데이터 구현하기
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
        {/* {children} */}
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
