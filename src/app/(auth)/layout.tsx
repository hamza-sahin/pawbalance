"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) router.replace("/search");
  }, [session, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (session) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
