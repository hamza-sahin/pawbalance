"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && session) {
      const redirect = searchParams.get("redirect") || "/search";
      router.replace(redirect);
    }
  }, [session, isLoading, router, searchParams]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (session) return null;

  return (
    <div className="safe-top flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-sm md:p-8">
        {children}
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </Suspense>
  );
}
