# PawBalance UI/UX Audit & Improvements Design Spec

**Date:** 2026-04-04
**Approach:** Screen-level redesigns for 4 key screens + targeted fixes for remaining issues
**Total items:** 19 (15 original audit findings + 4 review additions)

---

## Summary

A comprehensive UI/UX audit of all 24 screens across 8 flows identified 15 weak points in the current PawBalance app. After review against ui-ux-pro-max guidelines, 4 additional accessibility/interaction gaps were added. The fixes are organized into two groups:

1. **Screen Redesigns (4 screens):** Welcome, Home/Categories, Food Detail, Scanner — these are the highest-traffic screens where issues compound.
2. **Targeted Fixes (15 items):** Isolated changes to existing components across the remaining screens.

---

## Part 1: Screen Redesigns

### 1.1 Welcome Screen

**Problems:** ~40% dead space between benefits and CTA, flat benefit items with no visual hierarchy, no directional affordance on CTA.

**Changes:**
- Switch layout from `justify-between` to `justify-center` to eliminate the dead space gap
- Upgrade benefit items from flat icon-text pairs to elevated cards:
  - White background with subtle box-shadow (`shadow-sm`)
  - Color-coded icon backgrounds matching the safety color system:
    - Search: green (`bg-[#E8F5E9]`)
    - Nutrition: amber (`bg-[#FFF3E0]`)
    - Safety: red (`bg-[#FFEBEE]`)
  - Two-line layout: bold title + descriptive subtitle (e.g., "Safe food search" / "Check 200+ foods instantly")
  - Icon containers: 40x40px, `rounded-[10px]`
- Add right-arrow chevron SVG icon to "Get Started" CTA button
- Add subtle shadow to CTA button (`shadow-md` with primary color tint)
- Add subtle shadow to app icon for depth
- Expand subtitle `max-w` from `max-w-xs` to `max-w-sm` for Turkish translation resilience

**Files affected:**
- `src/app/welcome/page.tsx`

### 1.2 Home / Categories Grid

**Problems:** Plain letter-initial circles (A, B, D, F) are repeated and feel like placeholder UI. No visual scanning possible. No indication of category size.

**Changes:**
- Replace letter circles with unique SVG icons per category (Lucide icon set)
- Change icon container shape from circle (`rounded-full`) to rounded square (`rounded-xl`, 44x44px)
- Add color-coded pastel backgrounds per category (each category gets a unique tint)
- Add food count below category name in tertiary text (`text-xs text-secondary`)
- Bold the category name for better scanning

**Icon mapping (all 16 categories):**

| Category | Lucide Icon | Background Color |
|----------|------------|-----------------|
| Asian Fruit | `citrus` | `#FFF3E0` (orange-50) |
| Asian Vegetable | `carrot` | `#FFF8E1` (amber-50) |
| Bone | `bone` | `#F3E8FF` (purple-50) |
| Dairy | `milk` | `#EDE9FE` (violet-50) |
| Egg | `egg` | `#FEF3C7` (amber-100) |
| Fermented Food | `flask-round` | `#FDF2F8` (pink-50) |
| Fish | `fish` | `#E0F2FE` (sky-50) |
| Fruit | `apple` | `#DCFCE7` (green-100) |
| Grain | `wheat` | `#FEF9C3` (yellow-100) |
| Meat | `beef` | `#FEE2E2` (red-100) |
| Medicinal Herb | `leaf` | `#D1FAE5` (emerald-100) |
| Mushroom | `cloud` | `#F1F5F9` (slate-100) |
| Nuts | `nut` | `#FED7AA` (orange-200) |
| Organ | `heart-pulse` | `#FCE7F3` (pink-100) |
| Poisonous Plant | `skull` | `#FEE2E2` (red-100) |
| Vegetable | `salad` | `#ECFCCB` (lime-100) |

**Data source:** Food count per category comes from the `food_categories` table (`food_count` column), already available.

**Files affected:**
- `src/components/food/CategoryGrid.tsx`
- `src/lib/constants.ts` (add icon + color mapping)

### 1.3 Food Detail

**Problems:** Dead-end screen with no action path. Users read safety info and can't do anything with it. Section headers use emoji instead of SVG icons.

**Changes:**
- Add bottom action bar with two buttons:
  - **"Add to Recipe" (primary):** Full-width green button with `+` icon. Opens a bottom sheet listing existing recipes + "Create New Recipe" option. Pre-fills ingredient name and preparation text from the food detail data.
  - **"Share" (secondary):** 44x44px icon button. Uses Capacitor Share plugin (native share sheet) on iOS, `navigator.share` on web.
- Replace emoji section headers (⚠, 🍳, ♥) with Lucide SVG icons:
  - Dangerous Parts: `alert-circle` in red
  - Preparation: `lightbulb` in amber
  - Warnings: `alert-triangle` in amber
  - Benefits: `heart` in green
- Replace letter circle in food header with category-matched icon (same mapping as 1.2)
- Add `aria-label` to share button: `"Share food safety info"`

**"Add to Recipe" bottom sheet flow:**
1. Tap "Add to Recipe"
2. Bottom sheet slides up showing:
   - User's existing recipes as tappable rows (recipe name + ingredient count)
   - "+ Create New Recipe" at bottom
3. Tapping a recipe adds the food as an ingredient (name + preparation pre-filled)
4. Brief success toast: "Apple added to Test Daily Meal"
5. Sheet dismisses

**New component needed:** `src/components/food/AddToRecipeSheet.tsx`

**Files affected:**
- `src/app/(app)/search/food/page.tsx`
- `src/components/food/AddToRecipeSheet.tsx` (new)
- `src/components/food/SafetyBadge.tsx` (SVG icon swap)

### 1.4 Scanner Placeholder

**Problems:** ~55% dead space, misleading "Open Camera" button that does nothing, tiny PRO badge barely upsells.

**Changes:**
- Replace dashed-box-with-button with a visual scan preview:
  - Simulated viewfinder with corner bracket decorations (CSS borders)
  - Placeholder "label lines" (gray bars) representing a scanned document
  - No fake interactive button
- Add "How it works" section with 3 numbered steps:
  1. "Point camera at the ingredient list on any dog food package"
  2. "AI identifies each ingredient and cross-references our safety database"
  3. "Get a safety report with warnings, cautions, and benefits — personalized for your dog"
- Replace tiny PRO badge with a prominent upgrade CTA card:
  - Gradient background (`from-primary to-primary-dark`)
  - "Unlock Scanner" heading with layer icon
  - "Included with PawBalance Premium" subtitle
  - White "Upgrade to Premium" button
  - Card links to the premium upgrade flow

**Files affected:**
- `src/app/(app)/scan/page.tsx`

---

## Part 2: Targeted Fixes

### 2.1 Empty States with Illustrations (#2)

Add structured empty states with icon, headline, subtitle, and action button to all empty/placeholder screens.

| Screen | Component | Lucide Icon | Headline | Subtitle | Action |
|--------|-----------|-------------|----------|----------|--------|
| Recipe list (0 recipes) | `RecipeCard` area | `chef-hat` | No recipes yet | Create your first recipe to get AI nutrition analysis | + New Recipe |
| Search no-results | Search page | `search-x` | No foods found | Try a different spelling or browse categories | Browse Categories |
| Scan history | Scan history page | `clock` | Scan history coming soon | Your scanned food labels will appear here | — |
| New recipe ingredients | RecipeForm | `carrot` | No ingredients yet | Add ingredients from our food database | + Add Ingredient |

**Pattern:** 48px icon in a 72px tinted circle, centered. Headline in `text-lg font-semibold`. Subtitle in `text-sm text-secondary`. Action button in primary style below.

**Create reusable component:** `src/components/ui/EmptyState.tsx` accepting `icon`, `title`, `subtitle`, `action` props.

**Files affected:**
- `src/components/ui/EmptyState.tsx` (new)
- `src/app/(app)/recipes/page.tsx`
- `src/app/(app)/search/page.tsx`
- `src/app/(app)/profile/scan-history/page.tsx` (or equivalent)
- `src/components/recipe/RecipeForm.tsx`

### 2.2 Google Sign-In Brand Icon (#4)

Add the official Google "G" SVG to the left of "Sign in with Google" text.

- Icon: Google "G" logo (4-color version from brand guidelines, or monochrome)
- Size: 18x18px with 8px gap (`gap-2`) before text
- Keep white background + gray border (matches Google's own branding requirements)

**Files affected:**
- `src/components/auth/SocialLoginButtons.tsx`

### 2.3 Form Validation Feedback (#5)

Add inline validation to all forms across the app.

**Validation rules:**
- Email: format check on blur (`inputmode="email"`)
- Password: 6+ character minimum, shown as hint text below input
- Confirm Password: must match password, validated on blur
- Display Name: required, non-empty
- Recipe Name: required, non-empty
- Pet Name: required, non-empty
- Pet Weight: required, numeric (`inputmode="decimal"`)

**UI pattern:**
- Required fields: red asterisk (`*`) after label text
- Error state: input border changes to `border-red-400`, red error text below input
- Error text: `text-sm text-red-500` with `role="alert"` for screen readers
- Password hint: `text-xs text-secondary` below password input: "At least 6 characters"
- Validate on blur (not on every keystroke)

**Files affected:**
- `src/components/ui/Input.tsx` (add error prop and display)
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/components/recipe/RecipeForm.tsx`
- `src/components/pet/PetForm.tsx`

### 2.4 Search Result Count Grammar (#7)

Fix singular/plural: "1 results" → "1 result".

Use next-intl ICU plural syntax in both locale files:

```
"searchResultCount": "{count, plural, =0 {No results} one {1 result} other {# results}} for \"{query}\""
```

When count is 0, the empty state component (Fix 2.1) takes over instead of showing "0 results".

**Files affected:**
- `src/messages/en.json`
- `src/messages/tr.json`
- `src/app/(app)/search/page.tsx`

### 2.5 Actionable Recipe Analysis Suggestions (#8)

Make suggestions tappable to add ingredients directly.

**Changes:**
- Each suggestion row gets a "+ Add" button (small, outlined, on the right)
- Tapping "+ Add" triggers the add-ingredient flow:
  - Run the suggestion text through `search_foods` RPC. If it returns an exact match, add that food as an ingredient directly.
  - If no exact match, open the food search screen with the suggestion text pre-filled as the search query, so the user can pick the right food.
- After adding, the button changes to a green checkmark for 1 second, then the row visually mutes (lower opacity)

**Files affected:**
- `src/components/recipe/AnalysisReport.tsx`
- `src/hooks/use-recipes.ts` (add ingredient from suggestion)

### 2.6 Profile Menu Grouping (#9)

Group the 6 flat menu items into 3 labeled sections.

| Section Label | Items |
|---------------|-------|
| **My Account** | My Pets, Language |
| **Subscription** | Upgrade to Premium |
| **Support** | Scan History, Help & Support, About |

- Section labels: `text-xs text-secondary uppercase tracking-wider`, 16px top margin between sections
- Sign Out stays below all sections, separated by 24px gap, red text
- Items within a section share a single white card (grouped visually)

**Files affected:**
- `src/app/(app)/profile/page.tsx`

### 2.7 Scanner Placeholder (covered in 1.4)

### 2.8 Pet Edit Wizard Pattern (#11)

Make the form a true multi-step wizard instead of a progress bar on a single scrollable form.

**Steps:**
1. **Name** — Name, Breed (breed selector), Age (months), Weight (kg), Photo upload
2. **Gender** — Gender toggle (male/female), Neutered toggle
3. **Activity Level** — Activity level selector (low/moderate/high), BCS slider

**Behavior:**
- "Next" button advances to next step (validates current step fields first)
- Back arrow returns to previous step (preserves input)
- Progress bar segments fill as steps complete
- Final step shows "Save" instead of "Next"
- Close (X) shows confirmation dialog if any field was modified

**Files affected:**
- `src/components/pet/PetForm.tsx`
- `src/app/onboarding/page.tsx` (if shared wizard component)

### 2.9 Auth Input Placeholders (#12)

Add placeholder text to all auth form inputs.

| Field | Placeholder |
|-------|-------------|
| Email | `you@example.com` |
| Password | `At least 6 characters` |
| Confirm Password | `Re-enter your password` |
| Display Name | `How should we call you?` |

Placeholder color: `text-tertiary` (#B2BEC3), already defined in the design system.

**Files affected:**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`

### 2.10 Learn Tab Scroll Affordance (#13)

Add a fade gradient on the right edge of the horizontal tag chip container to signal more tags exist off-screen.

**Implementation:** CSS `mask-image` on the scrollable container:
```css
mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
```

This fades the last ~24px to transparent, revealing the canvas background and signaling scrollability.

**Files affected:**
- `src/app/(app)/learn/page.tsx` (or the tag chips component)

### 2.11 Skeleton/Loading States (#14)

Add `animate-pulse` skeleton screens matching the layout shape of each content type.

| Screen | Skeleton Shape |
|--------|----------------|
| Category grid | 3x4 grid of 44px rounded squares |
| Food list (category browse) | 4 card-shaped bars with left accent placeholder |
| Recipe list | 2 card skeletons with text line placeholders |
| Article list | 1 featured card skeleton + 2 compact row skeletons |
| Food detail | Header circle + 4 section card skeletons |

Use the existing `Skeleton` component from `src/components/ui/Skeleton.tsx`. Each loading state is co-located with its page component.

**Files affected:**
- `src/app/(app)/search/page.tsx`
- `src/app/(app)/search/category/page.tsx`
- `src/app/(app)/search/food/page.tsx`
- `src/app/(app)/recipes/page.tsx`
- `src/app/(app)/learn/page.tsx`

### 2.12 Sign Out Confirmation (#15)

Show a confirmation dialog before signing out.

- Reuse the existing `Dialog` component from `src/components/ui/Dialog.tsx`
- Title: "Sign Out"
- Body: "Are you sure you want to sign out?"
- Buttons: "Cancel" (secondary/gray) | "Sign Out" (destructive/red)
- Same pattern as the pet delete confirmation dialog

**Files affected:**
- `src/app/(app)/profile/page.tsx`

---

## Part 3: Review Additions (Accessibility & Interaction)

### 3.1 Touch Target Sizes on Pet Card Actions (#A)

The edit (pencil) and delete (trash) icons on pet cards are ~24px, below the 44x44px minimum.

**Fix:** Wrap icons in 44x44px tap areas: `min-w-[44px] min-h-[44px] flex items-center justify-center`.

**Files affected:**
- `src/components/pet/PetCard.tsx`

### 3.2 `aria-label` on Icon-Only Buttons (#B)

All icon-only buttons across the app must have `aria-label` attributes.

**Inventory of icon-only buttons needing labels:**
- Back arrows: `aria-label="Go back"`
- Share button (food detail): `aria-label="Share food safety info"`
- Add pet (+): `aria-label="Add new pet"`
- Edit pet (pencil): `aria-label="Edit pet"`
- Delete pet (trash): `aria-label="Delete pet"`
- Delete recipe (trash): `aria-label="Delete recipe"`
- Remove ingredient (x): `aria-label="Remove ingredient"`
- Clear search (x): `aria-label="Clear search"`
- Settings gear (profile): `aria-label="Settings"`
- Close dialog (x): `aria-label="Close"`
- Password visibility toggle (eye): `aria-label="Toggle password visibility"`

**Files affected:** Multiple components — audit all icon-only `<button>` elements during implementation.

### 3.3 Safety Color + Icon on Food List Accent Bars (#C)

The left border accent bars on food list cards (in category browse and search results) use color only to indicate safety level.

**Fix:** Add a small icon inside or adjacent to the accent bar:
- Safe: green border + small checkmark icon
- Caution: amber border + small warning icon
- Toxic: red border + small x-circle icon

This ensures color is not the sole indicator, meeting WCAG 1.4.1.

**Files affected:**
- `src/components/food/FoodCard.tsx`

### 3.4 `prefers-reduced-motion` on New Animations (#D)

All new animations added in this spec must respect the user's motion preference.

**Rule:** Wrap entrance animations, scale transitions, and fade-ins in:
```css
@media (prefers-reduced-motion: no-preference) { ... }
```

**Exempt:** `animate-pulse` on skeleton screens (loading indicator, not decorative).

**Applies to:**
- Welcome screen CTA scale animation
- Welcome screen benefit card entrance animations (if added)
- Empty state fade-in
- Recipe suggestion checkmark animation
- Bottom sheet slide-up animation

**Implementation:** Use Tailwind's `motion-safe:` prefix variant for all transition/animation classes.

---

## Out of Scope

These were considered but excluded to keep this spec focused:
- Favorites/bookmarking system for foods
- Search autocomplete/suggestions
- Drag-to-reorder ingredients in recipes
- Pull-to-refresh on list screens
- Nutrition facts/macronutrient breakdown in recipe analysis
- Onboarding flow redesign (not documented in screenshots)
- Dark mode
- Android-specific adjustments

---

## Pre-Delivery Checklist

Before shipping, verify against ui-ux-pro-max guidelines:

- [ ] No emojis used as icons (all Lucide SVG)
- [ ] All icons from consistent Lucide set
- [ ] Google logo SVG matches official brand mark
- [ ] Hover/active states don't cause layout shift
- [ ] All clickable elements have `cursor-pointer`
- [ ] Transitions are 150-300ms with `ease-out`
- [ ] Focus states visible (`focus-visible:ring-2`) on all interactive elements
- [ ] Light mode text contrast 4.5:1 minimum
- [ ] Touch targets minimum 44x44px
- [ ] `prefers-reduced-motion` respected on all new animations
- [ ] `aria-label` on all icon-only buttons
- [ ] `role="alert"` on all error messages
- [ ] `inputmode` set on email and numeric inputs
- [ ] Form labels use `htmlFor` attribute
- [ ] Color is never the sole indicator (icons + text accompany color)
- [ ] Responsive at 375px (iPhone SE) and 430px (iPhone 16 Pro Max)
- [ ] Skeleton loading states for all async content
- [ ] EN + TR translations for all new strings
