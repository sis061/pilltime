import type { Metadata } from "next";

import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PillTime home",
  description: "약먹어",
};

export default function MainLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <div>
      <header className="h-24 bg-blue-100">
        헤더
        <Link href={`/medicines/new`}>
          <Plus size={20} />
        </Link>
      </header>
      <main className="wrapper">{children}</main>
      {modal}
      <footer className="h-24 bg-red-100">푸터</footer>
    </div>
  );
}
