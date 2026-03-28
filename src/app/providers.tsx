"use client";

import { useAuthListener } from "@/hooks/use-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  useAuthListener();
  return <>{children}</>;
}
