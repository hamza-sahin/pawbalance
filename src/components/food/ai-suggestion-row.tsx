"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEntitlement } from "@/hooks/use-entitlement";
import { usePetStore } from "@/store/pet-store";
import { useAuthStore } from "@/store/auth-store";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";
import { Icons } from "@/components/ui/icon";

interface AISuggestionRowProps {
  query: string;
}

export function AISuggestionRow({ query }: AISuggestionRowProps) {
  const t = useTranslations();
  const router = useRouter();
  const { session } = useAuthStore();
  const { guardAction, isPaywallOpen, paywallTier, dismissPaywall } =
    useEntitlement();

  const pets = usePetStore((s) => s.pets);

  const handleTap = () => {
    // Unauthenticated users can't use AI — don't show paywall, just ignore
    if (!session) return;

    if (!guardAction("foods.ai_ask")) return;

    // Pro user — navigate to AI food detail
    const params = new URLSearchParams({ ai: "true", query });
    router.push(`/search/food?${params.toString()}`);
  };

  return (
    <>
      <button
        onClick={handleTap}
        className="flex w-full cursor-pointer items-center gap-3 rounded-card border border-primary/20 bg-primary/5 p-3 text-left transition-all duration-150 ease-out hover:bg-primary/10 active:scale-[0.98] active:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Icons.sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-txt">
            {pets.length > 0
              ? t("aiSuggestionLabel", {
                  food: query,
                  petName: pets.map((p) => p.name).join(", "),
                })
              : t("aiSuggestionGeneric", { food: query })}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {t("proRequired")}
        </span>
        <Icons.chevronRight
          className="h-4 w-4 text-txt-tertiary"
          aria-hidden="true"
        />
      </button>

      {isPaywallOpen && paywallTier && (
        <PaywallSheet
          requiredTier={paywallTier}
          onDismiss={dismissPaywall}
        />
      )}
    </>
  );
}
