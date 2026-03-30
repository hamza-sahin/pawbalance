# Guest Access & Tiered Access Control Architecture

**Date:** 2026-03-30
**Status:** Draft
**Scope:** Allow unauthenticated (guest) users to use the app with free features (search), gate other features behind login, and architect for future paywall tiers.

---

## Problem

The app currently requires authentication to access any feature. Apple App Store guidelines and user acquisition goals require that core features work without login. Search should be free. Other tabs should prompt login. The architecture must support future paid tiers (basic, premium) without structural changes.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Login prompt style | Bottom sheet overlay | Keeps user in context, feels native on iOS |
| Guest onboarding | Full pet wizard, stored locally | Seamless experience; pet syncs silently on sign-up |
| Pet sync on login | Auto-sync silently | No friction, no interruption |
| Nav tabs for guests | All 5 tabs visible | Users discover features naturally, see full value |
| Profile for guests | Limited view (pet + language) | Useful without being confusing |
| Architecture | Hybrid: route config + guard component | Route-level safety net + composable flexibility |

---

## Access Tier System

### Tier Hierarchy

```
guest (no auth)  <  free (auth, no subscription)  <  basic (paid)  <  premium (paid)
```

Guest and Free get identical feature access. The only difference is cloud sync and full profile.

### Route Access Map

| Route | Required Tier | Notes |
|-------|---------------|-------|
| `/search` (+ sub-routes) | `guest` | Free for everyone |
| `/profile` | `guest` | Limited view for guests, full for authenticated |
| `/bowl` | `basic` | Future: basic paywall |
| `/learn` | `basic` | Future: basic paywall |
| `/scan` | `premium` | Future: premium paywall |

### Resolution Logic

```
resolveUserTier(session, subscriptionTier):
  if no session         → "guest"
  if tier == "FREE"     → "free"
  if tier == "BASIC"    → "basic"
  if tier == "PREMIUM"  → "premium"

canAccess(userTier, requiredTier):
  return tierLevel(userTier) >= tierLevel(requiredTier)
```

### Gate Behavior

When `canAccess()` returns false:

| User State | Behavior |
|------------|----------|
| Not authenticated | Show `LoginSheet` bottom sheet overlay |
| Authenticated, tier too low | Show `PaywallSheet` (future — stub/no-op for now) |

---

## New File: `src/lib/access.ts`

Central access control module:

- `AccessTier` type: `"guest" | "free" | "basic" | "premium"`
- `ROUTE_ACCESS` config: maps route prefixes to required `AccessTier`
- `resolveUserTier(session, subscriptionTier)`: returns user's current `AccessTier`
- `canAccess(userTier, requiredTier)`: boolean comparison
- `getRequiredTier(pathname)`: looks up route in config, returns required tier

---

## New Component: `LoginSheet`

**File:** `src/components/auth/LoginSheet.tsx`

Bottom sheet modal that appears when an unauthenticated user taps a protected tab.

**Visual design:**
- Slides up from bottom with `border-radius: 20px 20px 0 0`
- Dimmed backdrop (`bg-black/40`)
- Drag handle at top (36px wide, 4px tall, border color)
- Headline: "Unlock more features"
- Subtitle: "Sign in to access everything PawBalance offers"
- Value proposition section with 3 benefits:
  - "Save your pet's profile to the cloud"
  - "Build balanced meals for your dog"
  - "Learn expert nutrition tips"
- Google sign-in button (dark, with Google icon)
- Email sign-in button (outlined)
- Apple sign-in button (native only, via `isNative` check)
- "Not now" text button to dismiss

**Behavior:**
- Renders as an overlay on top of the current page (not a route change)
- "Not now" dismisses the sheet; user navigates back to `/search`
- On successful auth (Google/Apple), sheet dismisses and the originally-requested page renders
- Uses existing `signInWithGoogle`, `signInWithEmail`, `signInWithApple` from `useAuth()`
- "Continue with Email" navigates to `/login` with `?redirect=<intended-path>` query param (reuses existing email auth flow)
- The `(auth)` layout's post-login redirect reads `?redirect` param; falls back to `/search` if absent

**i18n:** All strings use `next-intl` translation keys.

---

## New Component: `RequireAccess`

**File:** `src/components/auth/RequireAccess.tsx`

Composable guard component for sub-page feature gating (future use).

```tsx
<RequireAccess tier="premium" fallback={<UpgradeCard />}>
  <ScannerButton />
</RequireAccess>
```

- Wraps any content with a tier check
- If user tier >= required tier: render children
- If not: render fallback (or nothing)
- Not used in current implementation, but available for future paywall integration

---

## Modified: `(app)` Layout

**Current behavior:** Hard redirect to `/login` if no session.

**New behavior:**
1. Resolve user tier via `resolveUserTier()`
2. Look up required tier for current pathname via `getRequiredTier()`
3. If `canAccess()` → render children normally
4. If not authenticated → render `LoginSheet` overlay (children not rendered)
5. If authenticated but tier too low → render `PaywallSheet` stub (future)
6. BottomNav always renders regardless of access check
7. Pet fetching only runs when authenticated (`if (session) fetchPets()` — already exists)
8. Remove the `useAuthListener()` call (redundant — already runs in root `Providers`)
9. Onboarding redirect uses new logic (see below)

**Loading state:** Show spinner only while `isLoading` is true (auth initializing). Once resolved, immediately render based on tier — no more blocking on session existence.

---

## Modified: Onboarding Flow

### Trigger Logic

**New flag:** `onboarding_completed` in `localStorage` (boolean).

**Redirect conditions in `(app)` layout:**
```
if (!localStorage.onboarding_completed
    AND no guest_pet in localStorage
    AND (no session OR (session AND pets.length === 0)))
  → redirect to /onboarding
```

### Guest Onboarding (no session)

1. User lands on `/onboarding`
2. Fills out `PetForm` (same component, no changes)
3. On submit: save pet data as JSON to `localStorage` under key `guest_pet`
   - Generate a temporary ID: `local_<crypto.randomUUID()>` for the pet
   - If user picked a photo, store as data URL in `guest_pet` JSON (note: this can be ~100-500KB; acceptable for a single pet)
4. Set `onboarding_completed = true` in localStorage
5. Load pet into pet store with `isGuest: true` flag
6. Redirect to `/search`

### Authenticated Onboarding (has session, no pets)

Same as current behavior: `createPet()` to Supabase, redirect to `/search`.

---

## Modified: Pet Store

**New fields/methods on `usePetStore`:**

| Addition | Purpose |
|----------|---------|
| `isGuest: boolean` | Flag on pet objects to distinguish local-only pets |
| `loadGuestPet()` | Load `guest_pet` from localStorage into store |
| `clearGuestPet()` | Remove `guest_pet` from localStorage and store |

---

## Modified: `use-pets` Hook

**New behavior on auth state change:**

```
onAuthStateChange → session exists:
  1. Check localStorage for guest_pet
  2. If found:
     a. Call createPet() with guest_pet data
     b. On success: remove guest_pet from localStorage, clearGuestPet() in store
     c. On failure: keep guest_pet, retry on next app launch
  3. Fetch pets from Supabase as usual
```

**Guest pet loading (no session):**
- On mount, if no session, check localStorage for `guest_pet`
- If found, load into pet store with `isGuest: true`

---

## Modified: Onboarding Page

**File:** `src/app/onboarding/page.tsx`

Add session check to `handleSubmit`:

```
if (session) → createPet() to Supabase (existing)
if (!session) → save to localStorage as guest_pet, set onboarding_completed
```

No visual changes to the page.

---

## Modified: Profile Page

**File:** `src/app/(app)/profile/page.tsx`

Conditional rendering based on auth state:

**Guest view (no session):**
- Pet card (from local storage)
- Language selector
- "Sign in to unlock all features" card with sign-in button (opens LoginSheet)

**Authenticated view:**
- Everything currently shown (no changes)

---

## SubscriptionTier Type Update

**File:** `src/lib/types.ts`

The existing `SubscriptionTier` type is `"FREE" | "PREMIUM"`. This needs expansion:

```typescript
// Access control tiers (separate from SubscriptionTier)
type AccessTier = "guest" | "free" | "basic" | "premium";
```

`AccessTier` lives in `src/lib/access.ts` and is separate from `SubscriptionTier`. The `resolveUserTier()` function maps from auth state + `SubscriptionTier` to `AccessTier`.

When the `BASIC` subscription tier is added in the future, add it to `SubscriptionTier` in `types.ts` and update `resolveUserTier()` mapping. No other changes needed.

---

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/access.ts` | **Create** | AccessTier, ROUTE_ACCESS config, resolveUserTier(), canAccess(), getRequiredTier() |
| `src/components/auth/LoginSheet.tsx` | **Create** | Bottom sheet login overlay with value prop |
| `src/components/auth/RequireAccess.tsx` | **Create** | Composable guard component (future use) |
| `src/app/(app)/layout.tsx` | **Modify** | Replace hard auth redirect with tier-based gating |
| `src/app/onboarding/page.tsx` | **Modify** | Support guest pet creation to localStorage |
| `src/store/pet-store.ts` | **Modify** | Add isGuest flag, guest pet methods |
| `src/hooks/use-pets.ts` | **Modify** | Guest pet loading + silent sync on auth |
| `src/app/(app)/profile/page.tsx` | **Modify** | Conditional guest vs authenticated view |
| `src/app/(auth)/layout.tsx` | **Modify** | Read `?redirect` query param for post-login redirect |
| `src/messages/en.json` | **Modify** | Add LoginSheet and guest profile translation keys |
| `src/messages/tr.json` | **Modify** | Add LoginSheet and guest profile translation keys |

---

## What Is NOT In Scope

- Paywall UI (basic/premium subscription screens)
- RevenueCat / Stripe integration
- `PaywallSheet` implementation (stub only)
- Changes to the `SubscriptionTier` enum (stays `"FREE" | "PREMIUM"`)
- Any changes to search functionality
- Android support
