"use client";

import { useEffect } from "react";
import { useAuthListener } from "@/hooks/use-auth";
import { initOtaUpdates } from "@/lib/platform";

export function Providers({ children }: { children: React.ReactNode }) {
  useAuthListener();

  useEffect(() => {
    initOtaUpdates();
  }, []);

  return <>{children}</>;
}
