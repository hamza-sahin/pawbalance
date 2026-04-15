# Hide Scanner & Rename Tiers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide unimplemented scanner feature from UI, remove Premium tier display, rename Basic→Pro for App Store launch.

**Architecture:** UI-only changes across 6 files. No DB, API, type, or entitlement logic changes. Internal `"BASIC"`/`"PREMIUM"` enums stay — only display labels change.

**Tech Stack:** Next.js 15, next-intl, Tailwind CSS 4, TypeScript

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/components/navigation/bottom-nav.tsx` | Remove scanner tab + icon |
| Modify | `src/components/subscription/PaywallSheet.tsx` | Remove Premium plan, rename Basic→Pro, simplify to single-plan layout |
| Modify | `src/components/subscription/SubscriptionCard.tsx` | Remove PREMIUM display branch |
| Modify | `src/app/(app)/profile/page.tsx` | Remove scan history link, update tier badge |
| Modify | `src/messages/en.json` | Rename Basic→Pro, update Premium mentions |
| Modify | `src/messages/tr.json` | Same as en.json for Turkish |

---

### Task 1: Remove Scanner Tab from BottomNav

**Files:**
- Modify: `src/components/navigation/bottom-nav.tsx`

- [ ] **Step 1: Remove scanner from tabs array and its icon**

In `src/components/navigation/bottom-nav.tsx`, replace the entire `tabs` constant (lines 8-14):

```typescript
const tabs = [
  { key: "scanner", href: "/scan", label: "scanner" },
  { key: "recipes", href: "/recipes", label: "recipes" },
  { key: "search", href: "/search", label: "search" },
  { key: "learn", href: "/learn", label: "learn" },
  { key: "profile", href: "/profile", label: "profile" },
] as const;
```

with:

```typescript
const tabs = [
  { key: "recipes", href: "/recipes", label: "recipes" },
  { key: "search", href: "/search", label: "search" },
  { key: "learn", href: "/learn", label: "learn" },
  { key: "profile", href: "/profile", label: "profile" },
] as const;
```

Then remove the `scanner` entry from the `icons` record (lines 17-24):

```typescript
  scanner: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
```

Remove that entire block. The center FAB detection uses `tab.key === "search"` (line 54), not array index, so no index update needed.

- [ ] **Step 2: Verify build**

Run: `cd /Users/hamzasahin/src/pawbalance && npx next build 2>&1 | tail -5`
Expected: Build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/navigation/bottom-nav.tsx
git commit -m "ui: remove scanner tab from bottom navigation"
```

---

### Task 2: Update Translation Files

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Update en.json**

Change these values in `src/messages/en.json`:

Line 107 — rename `premiumPlan` display value (key stays, value changes so SubscriptionCard PREMIUM branch still works if somehow reached):
```json
"premiumPlan": "Premium Plan",
```
→ No change needed for premiumPlan — it's kept but unused.

Line 322 — rename basicPlan:
```json
"basicPlan": "Basic",
```
→
```json
"basicPlan": "Pro",
```

Line 323 — update basicPlanDesc (remove implicit scanner tie):
```json
"basicPlanDesc": "AI recipe analysis",
```
→
```json
"basicPlanDesc": "AI-powered recipe analysis for your dog",
```

Line 277 — update upgradeToAnalyze (mentions "Premium"):
```json
"upgradeToAnalyze": "Upgrade to Premium to analyze recipes",
```
→
```json
"upgradeToAnalyze": "Upgrade to Pro to analyze recipes",
```

Line 103 — update upgradeToPremium (used in scan page, but update for consistency):
```json
"upgradeToPremium": "Upgrade to Premium",
```
→
```json
"upgradeToPremium": "Upgrade to Pro",
```

- [ ] **Step 2: Update tr.json**

Same changes in `src/messages/tr.json`:

Line 322 — rename basicPlan:
```json
"basicPlan": "Temel",
```
→
```json
"basicPlan": "Pro",
```

Line 323 — update basicPlanDesc:
```json
"basicPlanDesc": "Yapay zeka tarif analizi",
```
→
```json
"basicPlanDesc": "Köpeğiniz için yapay zeka destekli tarif analizi",
```

Line 277 — update upgradeToAnalyze:
```json
"upgradeToAnalyze": "Tarifleri analiz etmek için Premium'a yükseltin",
```
→
```json
"upgradeToAnalyze": "Tarifleri analiz etmek için Pro'ya yükseltin",
```

Line 103 — update upgradeToPremium:
```json
"upgradeToPremium": "Premium'a Yükselt",
```
→
```json
"upgradeToPremium": "Pro'ya Yükselt",
```

- [ ] **Step 3: Commit**

```bash
git add src/messages/en.json src/messages/tr.json
git commit -m "i18n: rename Basic tier to Pro, update Premium references"
```

---

### Task 3: Simplify PaywallSheet to Single Plan

**Files:**
- Modify: `src/components/subscription/PaywallSheet.tsx`

- [ ] **Step 1: Remove Premium pricing, scanner features, and scanner context logic**

In `src/components/subscription/PaywallSheet.tsx`, make these changes:

**a)** Remove `PlanKey` type and simplify — the component no longer needs plan selection. Replace lines 16-42:

```typescript
type PlanKey = "basic" | "premium";
type Period = "monthly" | "annual";

const PRICES: Record<PlanKey, Record<Period, { amount: string; equivalent?: string }>> = {
  basic: {
    monthly: { amount: "$6.99" },
    annual: { amount: "$49.99", equivalent: "$4.17" },
  },
  premium: {
    monthly: { amount: "$9.99" },
    annual: { amount: "$79.99", equivalent: "$6.67" },
  },
};

const RECIPE_FEATURES = [
  "createRecipes",
  "aiAnalysis",
  "safetyAlerts",
  "personalizedDog",
] as const;

const SCANNER_FEATURES = [
  "scanLabels",
  "aiIngredientBreakdown",
  "createRecipes",
  "aiAnalysis",
] as const;
```

with:

```typescript
type Period = "monthly" | "annual";

const PRICES: Record<Period, { amount: string; equivalent?: string }> = {
  monthly: { amount: "$6.99" },
  annual: { amount: "$49.99", equivalent: "$4.17" },
};

const FEATURES = [
  "createRecipes",
  "aiAnalysis",
  "safetyAlerts",
  "personalizedDog",
] as const;
```

**b)** Update component state — remove `selectedPlan` and scanner context. Replace lines 44-56:

```typescript
export function PaywallSheet({ requiredTier, onDismiss }: PaywallSheetProps) {
  const t = useTranslations();
  const { purchase, restore } = usePurchases();
  const defaultPlan: PlanKey = requiredTier === "premium" ? "premium" : "basic";
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(defaultPlan);
  const [period, setPeriod] = useState<Period>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sheetRef, maximized, handlers: dragHandlers } = useSheetDrag({ onDismiss, disabled: isLoading });

  const isRecipeContext = requiredTier !== "premium";
  const features = isRecipeContext ? RECIPE_FEATURES : SCANNER_FEATURES;
  const price = PRICES[selectedPlan][period];
```

with:

```typescript
export function PaywallSheet({ requiredTier, onDismiss }: PaywallSheetProps) {
  const t = useTranslations();
  const { purchase, restore } = usePurchases();
  const [period, setPeriod] = useState<Period>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sheetRef, maximized, handlers: dragHandlers } = useSheetDrag({ onDismiss, disabled: isLoading });

  const price = PRICES[period];
```

**c)** Update `handlePurchase` — always purchase "basic" plan. Replace line 63:

```typescript
      const success = await purchase(selectedPlan, period);
```

with:

```typescript
      const success = await purchase("basic", period);
```

**d)** Remove `ScanLine` import. Replace line 5:

```typescript
import { UtensilsCrossed, ScanLine, Check } from "lucide-react";
```

with:

```typescript
import { UtensilsCrossed, Check } from "lucide-react";
```

**e)** Update the dialog aria-label and context icon — remove scanner branch. Replace lines 107-122:

```typescript
        aria-label={isRecipeContext ? t("unlockRecipes") : t("unlockScanner")}
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border md:hidden" />

        {/* Context icon */}
        <div className={`mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-[14px] ${
          isRecipeContext
            ? "bg-gradient-to-br from-primary to-primary-dark"
            : "bg-gradient-to-br from-caution to-[#c49518]"
        }`}>
          {isRecipeContext
            ? <UtensilsCrossed className="h-5 w-5 text-white" />
            : <ScanLine className="h-5 w-5 text-white" />
          }
        </div>
```

with:

```typescript
        aria-label={t("unlockRecipes")}
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border md:hidden" />

        {/* Context icon */}
        <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-primary to-primary-dark">
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </div>
```

**f)** Update title and description — remove scanner branch. Replace lines 125-130:

```typescript
        <h2 className="text-center text-xl font-bold text-txt">
          {isRecipeContext ? t("unlockRecipes") : t("unlockScanner")}
        </h2>
        <p className="mb-3 text-center text-[13px] text-txt-secondary">
          {isRecipeContext ? t("unlockRecipesDesc") : t("unlockScannerDesc")}
        </p>
```

with:

```typescript
        <h2 className="text-center text-xl font-bold text-txt">
          {t("unlockRecipes")}
        </h2>
        <p className="mb-3 text-center text-[13px] text-txt-secondary">
          {t("unlockRecipesDesc")}
        </p>
```

**g)** Replace the plan cards radiogroup (lines 158-204) with a simple price display:

Remove the entire `{/* Plan cards */}` section:

```typescript
        {/* Plan cards */}
        <div className="mb-3 flex flex-col gap-2.5" role="radiogroup" aria-label="Choose a plan">
          {(["basic", "premium"] as const).map((plan) => {
            const selected = selectedPlan === plan;
            const p = PRICES[plan][period];
            const tag = plan === "basic" && isRecipeContext ? t("mostPopular")
              : plan === "premium" && !isRecipeContext ? t("bestValue")
              : null;

            return (
              <button
                key={plan}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => !isLoading && setSelectedPlan(plan)}
                className={`relative flex min-h-[64px] cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] p-3.5 transition-all ${
                  selected ? "border-primary bg-primary/5" : "border-border"
                } ${isLoading ? "opacity-60 pointer-events-none" : ""}`}
              >
                {tag && (
                  <span className={`absolute -top-2 right-3 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase text-white ${
                    plan === "basic" ? "bg-primary" : "bg-caution"
                  }`}>
                    {tag}
                  </span>
                )}
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? "border-primary" : "border-border"
                }`}>
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
                <span className="flex-1 text-left">
                  <span className="block text-[15px] font-semibold text-txt">{t(`${plan}Plan`)}</span>
                  <span className="block text-[11px] text-txt-secondary">{t(`${plan}PlanDesc`)}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[17px] font-bold text-txt">{p.amount}</span>
                  <span className="block text-[11px] text-txt-secondary">{period === "monthly" ? t("perMonth") : t("perYear")}</span>
                  {p.equivalent && (
                    <span className="block text-[10px] text-txt-secondary">{t("perMonthEquiv", { price: p.equivalent })}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
```

Replace with a single price display block:

```typescript
        {/* Price */}
        <div className="mb-3 flex items-baseline justify-center gap-1">
          <span className="text-3xl font-bold text-txt">{price.amount}</span>
          <span className="text-sm text-txt-secondary">{period === "monthly" ? t("perMonth") : t("perYear")}</span>
          {price.equivalent && (
            <span className="ml-1 text-xs text-txt-tertiary">({t("perMonthEquiv", { price: price.equivalent })})</span>
          )}
        </div>
```

**h)** Update features to use `FEATURES` constant. Replace line 209:

```typescript
          {features.map((key) => (
```

with:

```typescript
          {FEATURES.map((key) => (
```

**i)** Update CTA aria-label — remove plan name reference. Replace line 224:

```typescript
          aria-label={`${t("startFreeTrial")} — ${t(`${selectedPlan}Plan`)}`}
```

with:

```typescript
          aria-label={t("startFreeTrial")}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/hamzasahin/src/pawbalance && npx next build 2>&1 | tail -5`
Expected: Build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/subscription/PaywallSheet.tsx
git commit -m "ui: simplify paywall to single Pro plan, remove scanner context"
```

---

### Task 4: Update SubscriptionCard

**Files:**
- Modify: `src/components/subscription/SubscriptionCard.tsx`

- [ ] **Step 1: Remove PREMIUM display branch**

In `src/components/subscription/SubscriptionCard.tsx`, replace lines 20-24:

```typescript
  const tierLabel = subscriptionTier === "PREMIUM"
    ? t("premiumPlan")
    : subscriptionTier === "BASIC"
    ? t("basicPlan")
    : t("freePlan");
```

with:

```typescript
  const tierLabel = subscriptionTier === "FREE"
    ? t("freePlan")
    : t("basicPlan");
```

This maps both `BASIC` and `PREMIUM` to `basicPlan` (which now displays "Pro" via translations). If a user somehow has PREMIUM in their metadata, they still see "Pro" — graceful degradation.

- [ ] **Step 2: Verify build**

Run: `cd /Users/hamzasahin/src/pawbalance && npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/subscription/SubscriptionCard.tsx
git commit -m "ui: simplify subscription card tier display to Free/Pro"
```

---

### Task 5: Update Profile Page

**Files:**
- Modify: `src/app/(app)/profile/page.tsx`

- [ ] **Step 1: Update tier badge and remove scan history link**

In `src/app/(app)/profile/page.tsx`, replace the tier badge (line 108-110):

```typescript
        <Badge>
          {subscriptionTier === "PREMIUM" ? t("premiumPlan") : subscriptionTier === "BASIC" ? t("basicPlan") : t("freePlan")}
        </Badge>
```

with:

```typescript
        <Badge>
          {subscriptionTier === "FREE" ? t("freePlan") : t("basicPlan")}
        </Badge>
```

Then remove the scan history menu item from the Support section. Replace lines 145-148:

```typescript
            {[
              { href: "/profile/scan-history", icon: Icons.history, label: t("scanHistory") },
              { href: "#", icon: Icons.help, label: t("helpAndSupport") },
              { href: "#", icon: Icons.info, label: t("about") },
            ].map((item) => (
```

with:

```typescript
            {[
              { href: "#", icon: Icons.help, label: t("helpAndSupport") },
              { href: "#", icon: Icons.info, label: t("about") },
            ].map((item) => (
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/hamzasahin/src/pawbalance && npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/profile/page.tsx
git commit -m "ui: update profile tier badge to Free/Pro, remove scan history link"
```

---

### Task 6: Verify Static Build

- [ ] **Step 1: Run full static build**

Run: `cd /Users/hamzasahin/src/pawbalance && npm run build 2>&1 | tail -20`
Expected: Static export completes successfully with no errors.

- [ ] **Step 2: Verify no remaining Premium display references in components**

Run:
```bash
cd /Users/hamzasahin/src/pawbalance && grep -rn '"PREMIUM"\|premiumPlan\|unlockScanner\|ScanLine\|scanner' src/components/ src/app/(app)/profile/page.tsx src/app/(app)/recipes/ --include='*.tsx' | grep -v 'node_modules'
```
Expected: No matches in modified files (scan page files are expected to still have references — they're unreachable but preserved).
