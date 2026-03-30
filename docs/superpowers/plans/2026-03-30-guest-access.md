# Guest Access & Tiered Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow unauthenticated users to use the app with free features (search), gate other tabs behind a login bottom sheet, and architect for future paywall tiers.

**Architecture:** Hybrid access control — a centralized route config maps routes to required tiers, the `(app)` layout uses it for route-level gating, and a `<RequireAccess>` component is available for future sub-page gating. Guest pets are stored in localStorage and silently synced to Supabase on sign-up.

**Tech Stack:** Next.js 15 (App Router), Zustand, Supabase, Tailwind CSS 4, next-intl, Capacitor

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/access.ts` | **Create** | AccessTier type, ROUTE_ACCESS config, resolveUserTier(), canAccess(), getRequiredTier() |
| `src/components/auth/LoginSheet.tsx` | **Create** | Bottom sheet modal with value prop, Google/Email/Apple login buttons |
| `src/components/auth/RequireAccess.tsx` | **Create** | Composable guard wrapper for sub-page feature gating (future use) |
| `src/store/pet-store.ts` | **Modify** | Add guest pet methods: loadGuestPet(), clearGuestPet() |
| `src/hooks/use-pets.ts` | **Modify** | Guest pet localStorage loading + silent sync on auth change |
| `src/app/onboarding/page.tsx` | **Modify** | Support guest pet creation (save to localStorage when no session) |
| `src/app/(app)/layout.tsx` | **Modify** | Replace hard auth redirect with tier-based access gating |
| `src/app/(auth)/layout.tsx` | **Modify** | Read `?redirect` query param for post-login redirect |
| `src/app/(app)/profile/page.tsx` | **Modify** | Conditional guest vs authenticated view |
| `src/messages/en.json` | **Modify** | Add i18n keys for LoginSheet, guest profile |
| `src/messages/tr.json` | **Modify** | Add Turkish translations for new keys |

---

### Task 1: Create Access Control Module

**Files:**
- Create: `src/lib/access.ts`

- [ ] **Step 1: Create `src/lib/access.ts`**

```typescript
import type { Session } from "@supabase/supabase-js";
import type { SubscriptionTier } from "@/lib/types";

export type AccessTier = "guest" | "free" | "basic" | "premium";

const TIER_LEVEL: Record<AccessTier, number> = {
  guest: 0,
  free: 1,
  basic: 2,
  premium: 3,
};

/**
 * Maps route prefixes to the minimum tier required to access them.
 * Routes not listed here default to "guest" (accessible by everyone).
 */
const ROUTE_ACCESS: Record<string, AccessTier> = {
  "/search": "guest",
  "/profile": "guest",
  "/bowl": "basic",
  "/learn": "basic",
  "/scan": "premium",
};

export function resolveUserTier(
  session: Session | null,
  subscriptionTier: SubscriptionTier,
): AccessTier {
  if (!session) return "guest";
  switch (subscriptionTier) {
    case "PREMIUM":
      return "premium";
    default:
      return "free";
  }
}

export function getRequiredTier(pathname: string): AccessTier {
  // Match against route prefixes — longest match wins
  const match = Object.keys(ROUTE_ACCESS)
    .filter((prefix) => pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ROUTE_ACCESS[match] : "guest";
}

export function canAccess(userTier: AccessTier, requiredTier: AccessTier): boolean {
  return TIER_LEVEL[userTier] >= TIER_LEVEL[requiredTier];
}

/**
 * Returns the reason access was denied.
 * Used by the layout to decide whether to show LoginSheet or PaywallSheet.
 */
export function getAccessGateReason(
  session: Session | null,
  userTier: AccessTier,
  requiredTier: AccessTier,
): "none" | "login" | "paywall" {
  if (canAccess(userTier, requiredTier)) return "none";
  if (!session) return "login";
  return "paywall";
}
```

- [ ] **Step 2: Verify the module compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `src/lib/access.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/access.ts
git commit -m "feat: add access control module with tier system and route config"
```

---

### Task 2: Add i18n Keys

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Add English translation keys to `src/messages/en.json`**

Add the following keys after the existing `"next": "İleri"` entry (at the end of the JSON object, before the closing `}`):

```json
  "loginSheetTitle": "Unlock more features",
  "loginSheetSubtitle": "Sign in to access everything PawBalance offers",
  "loginSheetBenefitCloud": "Save your pet's profile to the cloud",
  "loginSheetBenefitMeals": "Build balanced meals for your dog",
  "loginSheetBenefitLearn": "Learn expert nutrition tips",
  "continueWithGoogle": "Continue with Google",
  "continueWithEmail": "Continue with Email",
  "continueWithApple": "Continue with Apple",
  "notNow": "Not now",
  "guestSignInCard": "Sign in to unlock all features",
  "guestSignInCardDesc": "Sync your pet's data across devices and access all PawBalance features."
```

- [ ] **Step 2: Add Turkish translation keys to `src/messages/tr.json`**

Add the following keys at the end of the JSON object (before the closing `}`):

```json
  "loginSheetTitle": "Daha fazla özelliğin kilidini aç",
  "loginSheetSubtitle": "PawBalance'ın sunduğu her şeye erişmek için giriş yap",
  "loginSheetBenefitCloud": "Evcil hayvanınızın profilini buluta kaydedin",
  "loginSheetBenefitMeals": "Köpeğiniz için dengeli öğünler oluşturun",
  "loginSheetBenefitLearn": "Uzman beslenme ipuçlarını öğrenin",
  "continueWithGoogle": "Google ile devam et",
  "continueWithEmail": "E-posta ile devam et",
  "continueWithApple": "Apple ile devam et",
  "notNow": "Şimdi değil",
  "guestSignInCard": "Tüm özelliklerin kilidini açmak için giriş yapın",
  "guestSignInCardDesc": "Evcil hayvan verilerinizi cihazlar arasında senkronize edin ve tüm PawBalance özelliklerine erişin."
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "require('./src/messages/en.json'); require('./src/messages/tr.json'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add src/messages/en.json src/messages/tr.json
git commit -m "feat: add i18n keys for login sheet and guest profile"
```

---

### Task 3: Create LoginSheet Component

**Files:**
- Create: `src/components/auth/LoginSheet.tsx`

- [ ] **Step 1: Create `src/components/auth/LoginSheet.tsx`**

```tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { isNative } from "@/lib/platform";
import { Icons } from "@/components/ui/icon";

interface LoginSheetProps {
  /** Called when user dismisses the sheet via "Not now" or Escape */
  onDismiss: () => void;
}

export function LoginSheet({ onDismiss }: LoginSheetProps) {
  const t = useTranslations();
  const router = useRouter();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    // Match transition duration; skip delay if user prefers reduced motion
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200;
    setTimeout(onDismiss, delay);
  }, [onDismiss]);

  // Animate in on mount + move focus into the sheet
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
    } else {
      requestAnimationFrame(() => setVisible(true));
    }
    // Move focus to the sheet container for keyboard users
    sheetRef.current?.focus();
  }, []);

  // Escape key to dismiss
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleDismiss();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleDismiss]);

  // Simple focus trap: keep Tab cycling inside the sheet
  useEffect(() => {
    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, []);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error handled by auth
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleApple() {
    setAppleLoading(true);
    try {
      await signInWithApple();
    } catch {
      // Error handled by auth
    } finally {
      setAppleLoading(false);
    }
  }

  function handleEmail() {
    router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
  }

  const btnFocus = "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 motion-reduce:transition-none ${visible ? "opacity-40" : "opacity-0"}`}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={`relative w-full max-w-md rounded-t-[20px] bg-surface px-5 pb-8 pt-4 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-transform duration-200 ease-out motion-reduce:transition-none ${visible ? "translate-y-0" : "translate-y-full"}`}
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-modal="true"
        aria-label={t("loginSheetTitle")}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-border" />

        {/* Header */}
        <h2 className="text-center text-lg font-bold text-txt">{t("loginSheetTitle")}</h2>
        <p className="mt-1 text-center text-sm text-txt-secondary">{t("loginSheetSubtitle")}</p>

        {/* Value prop */}
        <div className="mt-4 rounded-card bg-canvas p-3.5">
          {[
            { icon: Icons.paw, text: t("loginSheetBenefitCloud") },
            { icon: Icons.bowl, text: t("loginSheetBenefitMeals") },
            { icon: Icons.learn, text: t("loginSheetBenefitLearn") },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-2.5 ${i > 0 ? "mt-2.5" : ""}`}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <span className="text-[13px] text-txt">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-button bg-txt px-5 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 ease-out active:scale-95 active:opacity-90 disabled:opacity-50 ${btnFocus}`}
          >
            {googleLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {t("continueWithGoogle")}
          </button>

          <button
            onClick={handleEmail}
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-button border border-border bg-surface px-5 py-3.5 text-[15px] font-semibold text-txt transition-all duration-150 ease-out active:scale-95 active:opacity-90 ${btnFocus}`}
          >
            <Icons.mail className="h-[18px] w-[18px]" aria-hidden="true" />
            {t("continueWithEmail")}
          </button>

          {isNative && (
            <button
              onClick={handleApple}
              disabled={appleLoading}
              className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-button bg-black px-5 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 ease-out active:scale-95 active:opacity-90 disabled:opacity-50 ${btnFocus}`}
            >
              {appleLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.62-2.2.44-3.06-.4C3.79 16.17 4.36 9.02 8.79 8.76c1.23.06 2.09.7 2.81.73.88-.18 1.73-.85 2.91-.77 1.37.1 2.39.61 3.07 1.57-2.78 1.68-2.12 5.39.47 6.42-.56 1.49-1.28 2.96-2.51 4.09l1.51-1.52zM12.05 8.68c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              {t("continueWithApple")}
            </button>
          )}

          <button
            onClick={handleDismiss}
            className={`mt-1 w-full cursor-pointer py-2.5 text-center text-sm text-txt-secondary transition-all duration-150 ease-out active:opacity-70 ${btnFocus}`}
          >
            {t("notNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors. Note: `Icons.bowl` and `Icons.learn` may not exist yet — if they error, use `Icons.paw` for all three benefits temporarily and fix in step 3.

- [ ] **Step 3: Fix icon references if needed**

Check if `Icons.bowl` and `Icons.learn` exist in `src/components/ui/icon.tsx`. The file already has:
- `bowl: UtensilsCrossed` — exists as the BottomNav icon mapping
- `learn: GraduationCap` — exists as the BottomNav icon mapping

Wait — checking the actual `Icons` object: it does NOT have `bowl` or `learn` keys. The BottomNav renders icons inline. The Icons object has `scanner: FileText` but not `bowl` or `learn`.

Add to `src/components/ui/icon.tsx` inside the `Icons` object, after the `learn: GraduationCap` line in the "Tabs" section:

The Icons object already has in the "Tabs" section:
```typescript
  // Tabs
  scanner: FileText,
  bowl: UtensilsCrossed,
  learn: GraduationCap,
```

Wait — let me re-check. The actual file shows:
```
scanner: FileText,
bowl: UtensilsCrossed,
learn: GraduationCap,
```

These ARE in the Icons object already. So `Icons.bowl` and `Icons.learn` should work. No fix needed.

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/LoginSheet.tsx
git commit -m "feat: create LoginSheet bottom sheet component"
```

---

### Task 4: Create RequireAccess Guard Component

**Files:**
- Create: `src/components/auth/RequireAccess.tsx`

- [ ] **Step 1: Create `src/components/auth/RequireAccess.tsx`**

```tsx
"use client";

import { type ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";
import { resolveUserTier, canAccess, type AccessTier } from "@/lib/access";

interface RequireAccessProps {
  /** Minimum tier required to see children */
  tier: AccessTier;
  /** Rendered when user's tier is insufficient. Defaults to null (render nothing). */
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequireAccess({ tier, fallback = null, children }: RequireAccessProps) {
  const { session, subscriptionTier } = useAuthStore();
  const userTier = resolveUserTier(session, subscriptionTier);

  if (canAccess(userTier, tier)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/RequireAccess.tsx
git commit -m "feat: create RequireAccess guard component for sub-page gating"
```

---

### Task 5: Add Guest Pet Support to Pet Store

**Files:**
- Modify: `src/store/pet-store.ts`

- [ ] **Step 1: Update `src/store/pet-store.ts` to add guest pet methods**

Replace the entire file content with:

```typescript
import { create } from "zustand";
import type { Pet } from "@/lib/types";
import type { PetFormValues } from "@/lib/validators";

const GUEST_PET_KEY = "guest_pet";
const ONBOARDING_KEY = "onboarding_completed";

interface PetState {
  pets: Pet[];
  selectedPetId: string | null;
  isLoading: boolean;
  setPets: (pets: Pet[]) => void;
  addPet: (pet: Pet) => void;
  updatePet: (id: string, updated: Pet) => void;
  removePet: (id: string) => void;
  setSelectedPetId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  /** Load a guest pet from localStorage into the store */
  loadGuestPet: () => void;
  /** Save a pet form as a guest pet to localStorage */
  saveGuestPet: (values: PetFormValues, photoDataUrl?: string | null) => void;
  /** Remove guest pet from localStorage and store */
  clearGuestPet: () => void;
  /** Get raw guest pet JSON from localStorage (for syncing) */
  getGuestPetData: () => { values: PetFormValues; photo?: string | null } | null;
}

/** Build a Pet object from form values for local display */
function buildLocalPet(values: PetFormValues, photoDataUrl?: string | null): Pet {
  const now = new Date().toISOString();
  return {
    id: `local_${crypto.randomUUID()}`,
    owner_id: "guest",
    name: values.name,
    breed: values.breed ?? null,
    age_months: values.age_months ?? null,
    weight_kg: values.weight_kg ?? null,
    gender: values.gender ?? null,
    is_neutered: values.is_neutered,
    body_condition_score: values.body_condition_score ?? null,
    activity_level: values.activity_level,
    known_allergies: null,
    avatar_url: photoDataUrl ?? null,
    created_at: now,
    updated_at: now,
  };
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  selectedPetId:
    typeof window !== "undefined"
      ? localStorage.getItem("selected_pet_id")
      : null,
  isLoading: true,

  setPets: (pets) => {
    const state = get();
    const selectedId =
      state.selectedPetId && pets.some((p) => p.id === state.selectedPetId)
        ? state.selectedPetId
        : pets[0]?.id ?? null;
    set({ pets, selectedPetId: selectedId, isLoading: false });
    if (selectedId) localStorage.setItem("selected_pet_id", selectedId);
  },

  addPet: (pet) =>
    set((s) => {
      const pets = [...s.pets, pet];
      const selectedPetId = s.selectedPetId ?? pet.id;
      localStorage.setItem("selected_pet_id", selectedPetId);
      return { pets, selectedPetId };
    }),

  updatePet: (id, updated) =>
    set((s) => ({ pets: s.pets.map((p) => (p.id === id ? updated : p)) })),

  removePet: (id) =>
    set((s) => {
      const pets = s.pets.filter((p) => p.id !== id);
      const selectedPetId =
        s.selectedPetId === id ? (pets[0]?.id ?? null) : s.selectedPetId;
      if (selectedPetId) localStorage.setItem("selected_pet_id", selectedPetId);
      else localStorage.removeItem("selected_pet_id");
      return { pets, selectedPetId };
    }),

  setSelectedPetId: (id) => {
    if (id) localStorage.setItem("selected_pet_id", id);
    else localStorage.removeItem("selected_pet_id");
    set({ selectedPetId: id });
  },

  setLoading: (isLoading) => set({ isLoading }),

  loadGuestPet: () => {
    try {
      const raw = localStorage.getItem(GUEST_PET_KEY);
      if (!raw) {
        set({ isLoading: false });
        return;
      }
      const { values, photo } = JSON.parse(raw) as { values: PetFormValues; photo?: string | null };
      const pet = buildLocalPet(values, photo);
      set({ pets: [pet], selectedPetId: pet.id, isLoading: false });
      localStorage.setItem("selected_pet_id", pet.id);
    } catch {
      set({ isLoading: false });
    }
  },

  saveGuestPet: (values, photoDataUrl) => {
    const payload = { values, photo: photoDataUrl ?? null };
    localStorage.setItem(GUEST_PET_KEY, JSON.stringify(payload));
    localStorage.setItem(ONBOARDING_KEY, "true");
    const pet = buildLocalPet(values, photoDataUrl);
    set({ pets: [pet], selectedPetId: pet.id, isLoading: false });
    localStorage.setItem("selected_pet_id", pet.id);
  },

  clearGuestPet: () => {
    localStorage.removeItem(GUEST_PET_KEY);
    // Don't clear onboarding_completed — it stays true
  },

  getGuestPetData: () => {
    try {
      const raw = localStorage.getItem(GUEST_PET_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as { values: PetFormValues; photo?: string | null };
    } catch {
      return null;
    }
  },
}));
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/store/pet-store.ts
git commit -m "feat: add guest pet localStorage support to pet store"
```

---

### Task 6: Update `use-pets` Hook for Guest Pet Sync

**Files:**
- Modify: `src/hooks/use-pets.ts`

- [ ] **Step 1: Replace `src/hooks/use-pets.ts` with guest pet support**

```typescript
"use client";

import { useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { usePetStore } from "@/store/pet-store";
import { useAuthStore } from "@/store/auth-store";
import type { Pet } from "@/lib/types";
import type { PetFormValues } from "@/lib/validators";
import { MAX_PETS } from "@/lib/constants";

export function usePets() {
  const {
    pets,
    selectedPetId,
    isLoading,
    setPets,
    addPet,
    updatePet,
    removePet,
    setSelectedPetId,
    setLoading,
    loadGuestPet,
    saveGuestPet,
    clearGuestPet,
    getGuestPetData,
  } = usePetStore();

  const selectedPet = pets.find((p) => p.id === selectedPetId) ?? null;
  const canAddMore = pets.length < MAX_PETS;

  const fetchPets = useCallback(async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    setPets((data as Pet[]) ?? []);
  }, [setPets, setLoading]);

  const createPet = useCallback(
    async (values: PetFormValues, photoDataUrl?: string | null) => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error("Not authenticated");
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("pets")
        .insert({
          owner_id: user.id,
          name: values.name,
          breed: values.breed,
          age_months: values.age_months,
          weight_kg: values.weight_kg,
          gender: values.gender,
          is_neutered: values.is_neutered,
          body_condition_score: values.body_condition_score,
          activity_level: values.activity_level,
          known_allergies: null,
        })
        .select()
        .single();
      if (error) throw error;

      let pet = data as Pet;

      if (photoDataUrl) {
        pet = await uploadPetPhoto(pet.id, photoDataUrl);
      }

      addPet(pet);
      return pet;
    },
    [addPet],
  );

  const editPet = useCallback(
    async (
      petId: string,
      values: PetFormValues,
      photoDataUrl?: string | null,
      removePhoto?: boolean,
    ) => {
      const supabase = getSupabase();

      if (removePhoto) {
        const user = useAuthStore.getState().user;
        if (user) {
          await supabase.storage.from("pet-photos").remove([`${user.id}/${petId}`]);
        }
      }

      const { data, error } = await supabase
        .from("pets")
        .update({
          name: values.name,
          breed: values.breed,
          age_months: values.age_months,
          weight_kg: values.weight_kg,
          gender: values.gender,
          is_neutered: values.is_neutered,
          body_condition_score: values.body_condition_score,
          activity_level: values.activity_level,
          ...(removePhoto ? { avatar_url: null } : {}),
        })
        .eq("id", petId)
        .select()
        .single();
      if (error) throw error;

      let pet = data as Pet;

      if (photoDataUrl && !removePhoto) {
        pet = await uploadPetPhoto(petId, photoDataUrl);
      }

      updatePet(petId, pet);
      return pet;
    },
    [updatePet],
  );

  const deletePet = useCallback(
    async (petId: string) => {
      const supabase = getSupabase();
      const user = useAuthStore.getState().user;

      if (user) {
        await supabase.storage.from("pet-photos").remove([`${user.id}/${petId}`]);
      }

      const { error } = await supabase.from("pets").delete().eq("id", petId);
      if (error) throw error;
      removePet(petId);
    },
    [removePet],
  );

  /**
   * Sync guest pet from localStorage to Supabase.
   * Called after user signs in/up. Silently creates the pet in the DB.
   */
  const syncGuestPet = useCallback(async () => {
    const guestData = getGuestPetData();
    if (!guestData) return;

    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      await createPet(guestData.values, guestData.photo);
      clearGuestPet();
    } catch {
      // Keep guest pet in localStorage — will retry on next app launch
    }
  }, [createPet, getGuestPetData, clearGuestPet]);

  return {
    pets,
    selectedPet,
    selectedPetId,
    isLoading,
    canAddMore,
    fetchPets,
    createPet,
    editPet,
    deletePet,
    setSelectedPetId,
    loadGuestPet,
    saveGuestPet,
    syncGuestPet,
  };
}

/** Helper: upload a data-URL photo to Supabase storage and update the pet row */
async function uploadPetPhoto(petId: string, dataUrl: string): Promise<Pet> {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Not authenticated");
  const supabase = getSupabase();

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = blob.type.split("/")[1] ?? "jpg";
  const path = `${user.id}/${petId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("pet-photos")
    .upload(path, blob, { upsert: true });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("pet-photos").getPublicUrl(path);

  const { data, error } = await supabase
    .from("pets")
    .update({ avatar_url: publicUrl })
    .eq("id", petId)
    .select()
    .single();
  if (error) throw error;
  return data as Pet;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-pets.ts
git commit -m "feat: add guest pet sync to use-pets hook"
```

---

### Task 7: Update Onboarding Page for Guest Mode

**Files:**
- Modify: `src/app/onboarding/page.tsx`

- [ ] **Step 1: Replace `src/app/onboarding/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth-store";
import { usePets } from "@/hooks/use-pets";
import { PetForm } from "@/components/pet/pet-form";
import type { PetFormValues } from "@/lib/validators";

export default function OnboardingPage() {
  const t = useTranslations();
  const router = useRouter();
  const { session } = useAuthStore();
  const { createPet, saveGuestPet } = usePets();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    values: PetFormValues,
    photo?: string | null,
  ) {
    setIsLoading(true);
    try {
      if (session) {
        // Authenticated: save to Supabase
        await createPet(values, photo);
      } else {
        // Guest: save to localStorage
        saveGuestPet(values, photo);
      }
      router.replace("/search");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="safe-top mx-auto min-h-screen max-w-md bg-canvas p-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-txt">{t("onboardingWelcome")}</h1>
        <p className="mt-2 text-sm text-txt-secondary">
          {t("onboardingSubtitle")}
        </p>
      </div>

      <PetForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat: support guest pet creation in onboarding"
```

---

### Task 8: Update `(app)` Layout for Tier-Based Access Gating

**Files:**
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Replace `src/app/(app)/layout.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth-store";
import { usePets } from "@/hooks/use-pets";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { LoginSheet } from "@/components/auth/LoginSheet";
import { Icons } from "@/components/ui/icon";
import { resolveUserTier, getRequiredTier, getAccessGateReason } from "@/lib/access";

const ONBOARDING_KEY = "onboarding_completed";
const GUEST_PET_KEY = "guest_pet";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const { session, subscriptionTier, isLoading: authLoading } = useAuthStore();
  const { pets, isLoading: petsLoading, fetchPets, loadGuestPet, syncGuestPet } = usePets();
  const router = useRouter();
  const pathname = usePathname();
  const [showLoginSheet, setShowLoginSheet] = useState(false);

  // Fetch pets when authenticated, load guest pet otherwise
  useEffect(() => {
    if (authLoading) return;
    if (session) {
      fetchPets();
      syncGuestPet();
    } else {
      loadGuestPet();
    }
  }, [authLoading, session, fetchPets, loadGuestPet, syncGuestPet]);

  // Redirect to onboarding if needed
  useEffect(() => {
    if (authLoading || petsLoading) return;

    const onboardingDone =
      typeof window !== "undefined" && localStorage.getItem(ONBOARDING_KEY) === "true";
    const hasGuestPet =
      typeof window !== "undefined" && localStorage.getItem(GUEST_PET_KEY) !== null;

    if (!onboardingDone && !hasGuestPet) {
      if (!session || (session && pets.length === 0)) {
        router.replace("/onboarding");
      }
    }
  }, [authLoading, petsLoading, session, pets.length, router]);

  // Determine access gate for current route
  const userTier = resolveUserTier(session, subscriptionTier);
  const requiredTier = getRequiredTier(pathname);
  const gateReason = getAccessGateReason(session, userTier, requiredTier);

  // Show/hide login sheet based on gate reason
  useEffect(() => {
    setShowLoginSheet(gateReason === "login");
  }, [gateReason, pathname]);

  // Show spinner only during initial auth loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="safe-top mx-auto min-h-screen max-w-md md:max-w-lg lg:max-w-2xl bg-canvas pb-20">
      {gateReason === "none" && children}
      {gateReason === "paywall" && (
        <div className="flex flex-col items-center justify-center px-4 pt-20 text-center">
          <Icons.crown className="mb-3 h-10 w-10 text-primary" aria-hidden="true" />
          <p className="text-lg font-bold text-txt">{t("comingSoon")}</p>
        </div>
      )}
      {showLoginSheet && (
        <LoginSheet onDismiss={() => router.replace("/search")} />
      )}
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/layout.tsx
git commit -m "feat: replace hard auth redirect with tier-based access gating"
```

---

### Task 9: Update Auth Layout for Redirect Param

**Files:**
- Modify: `src/app/(auth)/layout.tsx`

- [ ] **Step 1: Replace `src/app/(auth)/layout.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/(auth)/layout.tsx"
git commit -m "feat: read redirect query param in auth layout for post-login navigation"
```

---

### Task 10: Update Profile Page for Guest View

**Files:**
- Modify: `src/app/(app)/profile/page.tsx`

- [ ] **Step 1: Replace `src/app/(app)/profile/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { usePets } from "@/hooks/use-pets";
import { useLocale } from "@/hooks/use-locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icon";
import { LoginSheet } from "@/components/auth/LoginSheet";

export default function ProfilePage() {
  const t = useTranslations();
  const { displayName, avatarUrl, user, subscriptionTier, signOut, isAuthenticated } = useAuth();
  const { selectedPet } = usePets();
  const { locale } = useLocale();
  const [showLoginSheet, setShowLoginSheet] = useState(false);

  // Guest view
  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-bold text-txt">{t("profile")}</h1>
        </div>

        {/* Guest pet card */}
        {selectedPet && (
          <Card className="mb-4 flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-surface-variant">
              {selectedPet.avatar_url ? (
                <img src={selectedPet.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Icons.paw className="h-5 w-5 text-txt-tertiary" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-txt">{selectedPet.name}</p>
              {selectedPet.breed && (
                <p className="text-sm text-txt-secondary">{selectedPet.breed}</p>
              )}
            </div>
          </Card>
        )}

        {/* Sign in CTA card */}
        <button
          type="button"
          className="mb-4 w-full cursor-pointer rounded-card border border-border bg-surface p-4 text-left transition-all duration-150 ease-out active:scale-95 active:opacity-80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={() => setShowLoginSheet(true)}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icons.user className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-txt">{t("guestSignInCard")}</p>
              <p className="mt-0.5 text-sm text-txt-secondary">{t("guestSignInCardDesc")}</p>
            </div>
            <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
          </div>
        </button>

        {/* Language selector */}
        <Link href="/profile/language" className="block transition-all duration-150 ease-out active:scale-95 active:opacity-80">
          <Card className="flex items-center gap-3 p-4">
            <Icons.globe className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
            <span className="flex-1 font-medium text-txt">{t("language")}</span>
            <span className="text-sm text-txt-secondary">{locale === "tr" ? "Türkçe" : "English"}</span>
            <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
          </Card>
        </Link>

        {showLoginSheet && (
          <LoginSheet onDismiss={() => setShowLoginSheet(false)} />
        )}
      </div>
    );
  }

  // Authenticated view (existing)
  const menuItems = [
    { href: "/profile/pets", icon: Icons.paw, label: t("pets") },
    { href: "/profile/language", icon: Icons.globe, label: t("language"), trailing: locale === "tr" ? "Türkçe" : "English" },
    { href: "/profile/scan-history", icon: Icons.history, label: t("scanHistory") },
    { href: "#", icon: Icons.crown, label: t("upgradeToPremium"), badge: <Badge variant="premium">PRO</Badge> },
    { href: "#", icon: Icons.help, label: t("helpAndSupport") },
    { href: "#", icon: Icons.info, label: t("about") },
  ];

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-txt">{t("profile")}</h1>
        <button className="flex h-10 w-10 items-center justify-center rounded-lg text-txt-secondary transition-all duration-150 ease-out hover:bg-surface-variant active:scale-90 active:opacity-70" aria-label="Settings">
          <Icons.settings className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* User card */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-surface-variant text-3xl">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icons.user className="h-8 w-8 text-txt-tertiary" aria-hidden="true" />
          )}
        </div>
        <p className="text-lg font-bold text-txt">{displayName}</p>
        <p className="text-sm text-txt-secondary">{user?.email}</p>
        <Badge>
          {subscriptionTier === "PREMIUM" ? t("premiumPlan") : t("freePlan")}
        </Badge>
      </div>

      {/* Menu */}
      <div className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link key={item.label} href={item.href} className="block transition-all duration-150 ease-out active:scale-95 active:opacity-80">
            <Card className="flex items-center gap-3 p-4">
              <item.icon className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
              <span className="flex-1 font-medium text-txt">{item.label}</span>
              {item.trailing && (
                <span className="text-sm text-txt-secondary">{item.trailing}</span>
              )}
              {item.badge}
              <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
            </Card>
          </Link>
        ))}
      </div>

      <button
        onClick={signOut}
        className="mt-6 w-full rounded-button py-3 text-center font-medium text-error transition-all duration-150 ease-out hover:bg-error/5 active:scale-95 active:bg-error/10"
      >
        {t("signOut")}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/profile/page.tsx"
git commit -m "feat: add guest profile view with sign-in CTA card"
```

---

### Task 11: Build and Verify

**Files:** None (verification only)

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 2: Run static export build**

Run: `npm run build`
Expected: Build succeeds, static export to `out/` directory

- [ ] **Step 3: Fix any build errors**

If build errors occur, fix them. Common issues:
- `useSearchParams()` in auth layout may need a `<Suspense>` boundary for static export. If so, wrap the auth layout's inner content in `<Suspense>`.
- Missing icon references — verify `Icons.bowl` and `Icons.learn` exist in `src/components/ui/icon.tsx`.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build errors for guest access feature"
```

---

### Task 12: Manual Smoke Test Checklist

This is a verification checklist, not a code task. Test in the browser at `http://localhost:3000`.

- [ ] **Step 1: Clear all localStorage** — Open DevTools → Application → Local Storage → Clear all.

- [ ] **Step 2: Verify onboarding flow** — Navigate to `/search`. Should redirect to `/onboarding`. Fill out the pet form. Submit. Should redirect to `/search` and show the pet.

- [ ] **Step 3: Verify search works as guest** — Search for "apple" or browse categories. Food results should load from Supabase (this still works without auth since the Supabase anon key allows public reads).

- [ ] **Step 4: Verify protected tab shows login sheet** — Tap "Bowl" tab in bottom nav. Login sheet should slide up with value proposition. Tap "Not now". Should return to `/search`.

- [ ] **Step 5: Verify profile guest view** — Tap "Profile" tab. Should show pet card, sign-in CTA card, and language selector. No sign-out button.

- [ ] **Step 6: Verify login flow** — Tap a protected tab → login sheet appears → tap "Continue with Email" → should navigate to `/login?redirect=/bowl` (or whichever tab). After login, should redirect to the intended tab.

- [ ] **Step 7: Verify guest pet sync** — After logging in from step 6, the guest pet should be automatically synced to Supabase. Check the profile page — pet should still be visible. localStorage `guest_pet` key should be removed.

- [ ] **Step 8: Verify authenticated user on gated routes** — As a free authenticated user, tap "Bowl" or "Learn" → should see "Coming Soon" with crown icon (paywall placeholder). Tap "Search" → works normally.
