// app/(auth)/layout.tsx
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen wrapper flex items-center justify-center bg-pilltime-blue">
      {children}
    </div>
  );
}
