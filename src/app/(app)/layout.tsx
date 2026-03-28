"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useAuthListener } from "@/hooks/use-auth";
import { usePets } from "@/hooks/use-pets";
import { BottomNav } from "@/components/navigation/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useAuthListener();
  const { session, isLoading: authLoading } = useAuthStore();
  const { pets, isLoading: petsLoading, fetchPets } = usePets();
  const router = useRouter();

  // Fetch pets when authenticated
  useEffect(() => {
    if (session) fetchPets();
  }, [session, fetchPets]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !session) router.replace("/login");
  }, [authLoading, session, router]);

  // Redirect to onboarding if no pets
  useEffect(() => {
    if (!authLoading && !petsLoading && session && pets.length === 0) {
      router.replace("/onboarding");
    }
  }, [authLoading, petsLoading, session, pets.length, router]);

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-canvas pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
