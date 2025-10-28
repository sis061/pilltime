import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full max-w-none px-4 sm:px-8 md:px-12 lg:px-16 flex items-center justify-center bg-pilltime-blue">
      {children}
    </div>
  );
}
