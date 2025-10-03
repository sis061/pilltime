import type { Metadata } from "next";

import localFont from "next/font/local";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
