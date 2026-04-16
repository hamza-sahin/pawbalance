"use client";

import { useCallback } from "react";
import { useFoodStore } from "@/store/food-store";
import { useAuthStore } from "@/store/auth-store";

export type { AIFoodStatus } from "@/store/food-store";

export function useAIFoodLookup() {
  const aiLookup = useFoodStore((s) => s.aiLookup);
  const startAILookup = useFoodStore((s) => s.startAILookup);
  const abortAILookup = useFoodStore((s) => s.abortAILookup);
  const { session } = useAuthStore();

  const lookup = useCallback(
    (query: string, locale: string) => {
      if (!session?.access_token) return;
      startAILookup(query, locale, session.access_token);
    },
    [session, startAILookup],
  );

  return {
    status: aiLookup?.status ?? "idle",
    result: aiLookup?.result ?? null,
    error: aiLookup?.error ?? null,
    statusText: aiLookup?.statusText ?? null,
    lookup,
    abort: abortAILookup,
  };
}
