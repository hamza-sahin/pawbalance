# PawBalance Comprehensive UI/UX Audit

**Date:** 2026-03-29
**Scope:** 95 screenshots (5 viewports x 19 screens) + 30 source files
**Viewports:** Desktop 1440px, Desktop 768px, iPhone SE, iPhone 16, iPhone 16 Pro Max

---

## Executive Summary

The audit identified **147 unique issues** across the PawBalance app. The most impactful problems fall into 8 systemic categories that affect nearly every screen. Fixing these 8 categories would resolve ~80% of all issues.

| Severity | Count | Key Theme |
|----------|-------|-----------|
| **CRITICAL** | 18 | Emoji icons, iOS safe area, touch targets, accessibility |
| **HIGH** | 38 | Wasted space, no branding, i18n gaps, missing ARIA |
| **MEDIUM** | 55 | Form UX, contrast, consistency, missing states |
| **LOW** | 36 | Polish, transitions, minor a11y, legal |

---

## The 8 Systemic Issues

These are the root causes behind the majority of individual findings. Each one affects multiple screens and devices.

### 1. EMOJI ICONS EVERYWHERE (CRITICAL)

**40+ instances across 15 files.** Every flow uses raw emoji characters instead of proper SVG icons.

| Location | Emojis Used |
|----------|-------------|
| Category grid | Food category emojis (fruit, meat, dairy, etc.) |
| Food detail sections | `🚫` `🍳` `⚠️` `💚` |
| Search bar | `🔍` (search), `✕` (clear) |
| Pet card stats | `🐾` `🎂` `⚖️` `⚡` `🏠` |
| Pet card actions | `✏️` (edit), `🗑️` (delete) |
| Photo picker | `🐾` placeholder |
| Profile menu items | `🐾` `🌐` `🕒` `⭐` `❓` `ℹ️` `⚙️` `👤` |
| Scan tab | `📄` `⭐` |
| Bowl tab | `🍳` `📊` `🍽` |
| Learn tab | `🔍` `📚` `✓` |
| Forgot password | `✉️` |
| Safety badges | `✓` `⚠` `✕` |
| Bottom nav chevrons | `›` |
| Back buttons | `←` |

**Problems:**
- Render inconsistently across iOS, Android, macOS, Windows, and browsers
- Cannot be color-controlled via CSS (break theming)
- No `aria-hidden` on any of them -- screen readers announce emoji names
- Look amateurish and unprofessional
- Contrast with the polished SVG icons in the bottom navigation bar

**Fix:** Adopt a single SVG icon library (Lucide React recommended) and replace every emoji. Add `aria-hidden="true"` to all decorative icons.

**Files to change:** `constants.ts` (getCategoryIcon), `pet-card.tsx`, `food-card.tsx`, `category-grid.tsx`, `safety-badge.tsx`, `photo-picker.tsx`, `search/page.tsx`, `food/page.tsx`, `category/page.tsx`, `profile/page.tsx`, `scan/page.tsx`, `bowl/page.tsx`, `learn/page.tsx`, `forgot-password/page.tsx`, `bottom-nav.tsx` (chevrons only)

---

### 2. iOS SAFE AREA VIOLATIONS (CRITICAL)

**Affected:** iPhone 16 and iPhone 16 Pro Max on ALL screens with top content.

The app has **no `env(safe-area-inset-top)` padding** on any page. Content renders directly under the Dynamic Island and status bar.

| Screen | Visual Impact |
|--------|--------------|
| Search home | "Can Luna eat..." occluded by Dynamic Island |
| Bowl tab | "Bowl9:41" -- title merges with status bar time |
| Learn tab | "Learn9:41" -- same merge |
| Profile | "Profi9:41" -- same merge |
| Onboarding | "Welcome to PawBalance!" partially hidden behind Dynamic Island |
| Food detail | Back `←` overlaps status bar |
| Category browse | "← Back" collides with "9:41" |
| Food request dialog | Dialog title clipped by Dynamic Island |
| Delete dialog | Dialog title overlaps status bar |
| All subpages | "Ba9:41" / "Bac9:41" on back navigation |

**Root cause:** `src/app/(app)/layout.tsx` line 42 and `src/app/onboarding/page.tsx` line 30 both use `p-4` with no safe area awareness. The bottom nav correctly uses `pb-[env(safe-area-inset-bottom)]` but no equivalent exists for top.

**Fix:** Add `pt-[env(safe-area-inset-top)]` to the app layout container and the onboarding page. Also fix the `<dialog>` component to respect safe areas.

**Files to change:** `src/app/(app)/layout.tsx`, `src/app/onboarding/page.tsx`, `src/components/ui/dialog.tsx`

---

### 3. MASSIVE WASTED SPACE ON DESKTOP (HIGH)

**Affected:** Every screen at 1440px, most screens at 768px.

The entire app shell uses `max-w-md` (448px) centered on the viewport. At 1440px, this means **69% of the screen is empty beige canvas**. The app looks like a phone emulator, not a responsive web app.

| Screen | Content Width | Viewport Width | Utilization |
|--------|--------------|----------------|-------------|
| All app pages | 448px | 1440px | 31% |
| All app pages | 448px | 768px | 58% |
| Auth pages | 384px (`max-w-sm`) | 1440px | 27% |

**Problems:**
- No card/surface container around forms (content floats on beige void)
- Category grid stuck at 3 columns regardless of space
- Food detail, profile menus, pet cards all needlessly narrow
- Placeholder tabs show tiny content islands in vast emptiness

**Fix options (pick one):**
- **A) Responsive max-width:** `max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl` with adaptive layouts
- **B) Card-centered approach:** Keep narrow max-width but wrap content in elevated Card component with illustration/branding in the surrounding space
- **C) Split layout on large screens:** Sidebar navigation + wider content area for desktop

**Recommendation:** Option A for app pages, Option B for auth pages.

**Files to change:** `src/app/(app)/layout.tsx`, `src/app/(auth)/layout.tsx`, `src/components/food/category-grid.tsx` (responsive columns)

---

### 4. NO BRANDING OR VISUAL IDENTITY (HIGH)

**Affected:** All auth screens (login, register, forgot password), onboarding.

- **No logo** anywhere in the app
- **No app icon**, mascot, or illustration
- Auth screens show only plain text "PawBalance" as a subtitle
- No tagline explaining what the app does
- First-time users see a bare form with no emotional connection

**Problems:**
- Zero brand recognition or trust building
- No differentiation from competitors
- Users can't tell what the app is about from the login screen
- App Store screenshots would look generic

**Fix:**
- Design a logo/icon (paw + balance scale concept)
- Add it prominently to auth screens
- Add a tagline (e.g., "Safe food guide for your pet")
- Consider adding illustrations to onboarding and empty states

---

### 5. ACCESSIBILITY FAILURES (CRITICAL + HIGH)

**40+ accessibility violations across nearly every component.**

#### Missing ARIA labels (CRITICAL)
| Element | File | Line |
|---------|------|------|
| Search center nav button | `bottom-nav.tsx` | 60-69 |
| Settings gear button | `profile/page.tsx` | 38 |
| Pet edit/delete buttons | `pet-card.tsx` | 43-49 |
| Search clear button | `search/page.tsx` | 84 |
| Back navigation links | `food/page.tsx`, `category/page.tsx` | 47, 31 |
| Photo picker button | `photo-picker.tsx` | 40 |
| Breed selector input | `breed-selector.tsx` | 22 |

#### Missing label-input association (HIGH)
Every `<Input>` usage fails to pass an `id` prop. The `<label htmlFor>` receives `undefined`, breaking the programmatic association. Affects: login, register, forgot-password, pet-form, food-request-dialog.

**Fix:** Auto-generate IDs in the Input component using React's `useId()` hook.

#### Missing focus-visible states (HIGH)
No interactive element in the app has a visible `focus-visible` ring. Keyboard users cannot see which element is focused. Affects: Button, Input, all Link components, bottom nav, category grid, food cards, chips.

**Fix:** Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` to the base button styles and create a shared focus utility class.

#### Missing ARIA roles on custom widgets (CRITICAL)
- **BreedSelector:** No `role="combobox"`, `aria-expanded`, `aria-activedescendant`, or arrow-key navigation. Completely inaccessible to keyboard/screen reader users.
- **Gender toggle:** No `role="radiogroup"` / `role="radio"` or `aria-pressed`.
- **Activity level selector:** Same missing radio group semantics.
- **BCS slider:** No `aria-label` or `aria-valuetext`.

#### Error messages not announced (MEDIUM)
All form error messages (`<p>` tags) lack `role="alert"` or `aria-live`. Screen readers don't announce validation errors. Affects: login, register, forgot-password, food-request-dialog.

#### Missing `aria-describedby` on inputs with errors (MEDIUM)
The Input component shows error text but doesn't link it to the input via `aria-describedby`.

---

### 6. INTERNATIONALIZATION (i18n) GAPS (HIGH)

**20+ hardcoded English strings** bypass the next-intl translation system. Turkish users see English for these strings.

| String | File | Line |
|--------|------|------|
| `"Password must be at least 6 characters"` | `register/page.tsx` | 25 |
| `"Passwords do not match"` | `register/page.tsx` | 29 |
| `"Sign up failed"` | `register/page.tsx` | 36 |
| `"Sign in failed"` | `login/page.tsx` | 26 |
| `"Failed to send reset email"` | `forgot-password/page.tsx` | 27 |
| `"Food name must be at least 2 characters"` | `food-request-dialog.tsx` | 30 |
| `"Failed to submit request..."` | `food-request-dialog.tsx` | 37 |
| `"months"` | `pet-form.tsx` | 99 |
| `"kg"` | `pet-form.tsx` | 109 |
| `"Add photo"` | `photo-picker.tsx` | 46 |
| `"Pet photo"` | `photo-picker.tsx` | 39 |
| `"Daily Calories:"` | `pet-card.tsx` | 78 |
| `"months"` | `pet-card.tsx` | 59 |
| `"kg"` | `pet-card.tsx` | 64 |
| `"Intact"` | `pet-card.tsx` | 69 |
| `"← Back"` | `category/page.tsx` | 31 |
| `"foods"` | `category/page.tsx` | 37 |
| All BCS labels | `bcs-slider.tsx` | 27-46 |
| All Activity Level labels | `constants.ts` | ~257-261 |
| BCS score descriptions | `constants.ts` | BCS_DATA |

**Fix:** Move all strings to `messages/en.json` and `messages/tr.json`, replace with `t()` calls.

---

### 7. TOUCH TARGET VIOLATIONS (CRITICAL)

**8+ interactive elements below the 44x44px iOS minimum.**

| Element | Estimated Size | File |
|---------|---------------|------|
| "Forgot Password?" link | ~15x16px | `login/page.tsx` |
| "Sign Up" / "Sign In" toggle | ~40x16px | `login/page.tsx`, `register/page.tsx` |
| "Back to Sign In" link | ~80x16px | `forgot-password/page.tsx` |
| Pet edit emoji button | ~24x24px | `pet-card.tsx` |
| Pet delete emoji button | ~24x24px | `pet-card.tsx` |
| Bottom nav non-center tabs | ~60x30px | `bottom-nav.tsx` |
| "Request New Food" link | ~120x16px | `search/page.tsx` |
| "Remove photo" link | ~80x16px | `photo-picker.tsx` |

**Fix:** Add `min-h-[44px] min-w-[44px]` and padding to all interactive elements. For text links, use `py-2 px-3` padding.

---

### 8. FORM UX ISSUES (MEDIUM-HIGH)

#### Onboarding form is too long for a single page
- **No progress indicator** -- users don't know how long the form is
- **Submit button below the fold** on ALL devices (including 1440px desktop)
- On iPhone SE, only ~40% of the form is visible without scrolling

**Fix:** Either paginate into a multi-step wizard (recommended for mobile) or add a sticky submit button + progress bar.

#### Missing password visibility toggle
Both login and register forms lack a show/hide password toggle. Register has TWO password fields with no way to verify input.

#### No input placeholders
No input fields have placeholder text showing expected format (e.g., "name@example.com").

#### Browser autofill styling clash
Chrome's blue autofill background clashes with the warm beige design. Needs CSS overrides.

#### Weight required indicator vs schema mismatch
The form shows "Weight *" (required) but the Zod schema allows null.

#### Native checkbox for "Neutered"
Uses browser-default `<input type="checkbox">` with only `accent-primary`. Looks inconsistent with the custom UI.

#### Breed selector UX issues
- No keyboard navigation
- No "no results" message
- Doesn't close on outside click or Escape
- Silently truncates to 20 results with no indication

---

## Per-Screen Issue Index

### Auth Flow (15 screenshots)

| Issue | Login | Register | Forgot Password |
|-------|-------|----------|-----------------|
| No logo/branding | All devices | All devices | All devices |
| No card container | All devices | All devices | All devices |
| Touch target too small | "Forgot Password?" link | "Sign In" link | "Back to Sign In" link |
| Button contrast (3.1:1) | All devices | All devices | All devices |
| No password toggle | All devices | All devices | N/A |
| No input placeholders | All devices | All devices | All devices |
| Missing input IDs | All devices | All devices | All devices |
| Hardcoded error strings | All devices | All devices | All devices |
| Content clipped | N/A | iPhone SE (bottom) | N/A |
| Status bar collision | iPhone SE | N/A | N/A |
| Missing Google/Apple icons | All devices | All devices | N/A |
| No Terms of Service link | N/A | All devices | N/A |
| Autofill style clash | 768px | 768px | N/A |
| "Or continue with" low contrast | All devices | All devices | N/A |

### Onboarding (5 screenshots)

| Issue | Devices Affected |
|-------|-----------------|
| Dynamic Island occludes title | iPhone 16, iPhone 16 Pro Max |
| No progress indicator | All |
| Submit button below fold | All |
| Emoji photo picker icon | All |
| No card container | All |
| Hardcoded activity level labels | All |
| Hardcoded BCS labels | All |
| Massive wasted space at 1440px | Desktop 1440 |
| Gender button wrong border-radius | All |
| Weight required vs nullable schema | All |
| Native checkbox styling | All |
| No field grouping/sections | All |

### Search Flow (30 screenshots)

| Issue | Devices Affected |
|-------|-----------------|
| Emoji icons throughout | All |
| Dynamic Island title collision | iPhone 16, iPhone 16 Pro Max |
| max-w-md desktop waste | Desktop 1440, 768 |
| No empty state illustration | All |
| Back button no touch target | All |
| Category grid fixed 3 columns | All |
| "1 results" grammar | All |
| Bottom nav FAB overlaps labels | All iOS |
| Hardcoded "← Back", "foods" | All |
| Dialog anchored to top-left | Desktop |
| Dialog title clipped by Dynamic Island | iPhone 16, Pro Max |
| Search bar emoji icon | All |
| No search suggestions | All |
| Uneven category card text wrapping | iPhone SE |
| 10px nav label text | All |

### Placeholder Tabs (15 screenshots)

| Issue | Scan | Bowl | Learn |
|-------|------|------|-------|
| Emoji icons | `📄` `⭐` | `🍳` `📊` `🍽` | `🔍` `📚` `✓` |
| Title/status bar collision | N/A | iPhone 16, PM | iPhone 16, PM |
| Massive empty space | All | All | All |
| Bottom nav FAB overlaps | All iOS | All iOS | All iOS |
| Content not vertically centered | All | All | All |
| Dashed border looks like dropzone | All (Scan) | N/A | N/A |
| Non-functional button | All (Scan "Open Camera") | N/A | N/A |
| Feature cards look clickable but aren't | N/A | All (Bowl) | N/A |
| Disabled search input no visual state | N/A | N/A | All (Learn) |
| Wrong nav icon (house != bowl) | N/A | All | N/A |
| Active nav state barely visible | All | All | All |
| Inconsistent heading alignment | Centered | Left | Left |

### Profile Flow (30 screenshots)

| Issue | Profile | Pets List | Pet Edit | Delete Dialog | Language | Scan History |
|-------|---------|-----------|----------|---------------|----------|--------------|
| Emoji icons | Settings, avatar, menu | Edit/delete, stats | Photo picker | N/A | Flags | Clock |
| Title/status bar collision | iPhone 16, PM | iPhone 16, PM | iPhone 16, PM | iPhone 16, PM | iPhone 16, PM | iPhone 16, PM |
| Dialog positioning | N/A | N/A | N/A | All | N/A | N/A |
| Hardcoded English | N/A | "Daily Calories", "months", "kg" | "months", "kg" | N/A | N/A | N/A |
| Sign-out no confirmation | All | N/A | N/A | N/A | N/A | N/A |
| Breed not loading in edit | N/A | N/A | All | N/A | N/A | N/A |
| Form clipped by bottom nav | N/A | N/A | All | N/A | N/A | N/A |
| Massive empty space | All at 1440 | All at 1440 | N/A | N/A | All | All |
| Inconsistent header layout | Centered | Left+centered | Left+close | N/A | Left 2-line | Left 2-line |

---

## Button Contrast Issue

The primary button uses `bg-primary` (#7C9A82) with `text-white`. Measured contrast ratio: **~3.1:1** -- fails WCAG AA (requires 4.5:1 for normal text, 3:1 for large text at 18.66px bold+).

**Current button text is ~16px bold**, which is below the large text threshold. This is a WCAG AA failure.

**Fix options:**
- Darken primary to `#526B57` (the existing `--color-primary-dark`) for buttons only
- Use `--color-txt` (#2D3436) on the primary background
- Increase button font size to 18.66px+ bold to qualify as "large text"

**Recommendation:** Define a `--color-primary-button` at `#4A7C59` (darker sage) that maintains brand feel while hitting 4.5:1 on white.

---

## Priority Remediation Roadmap

### Phase 1: Critical Fixes (Safety + Accessibility)
1. Add `env(safe-area-inset-top)` padding to app layout and onboarding
2. Replace ALL emoji with SVG icons (Lucide React)
3. Add `aria-label` to all icon-only buttons
4. Fix button text contrast ratio
5. Add `min-h-[44px]` to all touch targets
6. Fix BreedSelector keyboard accessibility

### Phase 2: High-Impact UX
7. Add logo/branding to auth and onboarding screens
8. Wrap auth forms in Card component
9. Implement responsive max-width for desktop viewports
10. Add password visibility toggle
11. Paginate onboarding form into multi-step wizard with progress indicator
12. Move all hardcoded strings to i18n

### Phase 3: Polish + Consistency
13. Auto-generate input IDs via `useId()` + add `aria-describedby` for errors
14. Add `focus-visible` rings to all interactive elements
15. Add `role="alert"` to all error messages
16. Create consistent page header component
17. Fix dialog centering on iOS/Capacitor
18. Replace native checkbox with styled toggle
19. Add empty state illustrations
20. Vertically center placeholder tab content

### Phase 4: Refinements
21. Add `aria-current="page"` to active nav tab
22. Fix "1 results" → "1 result" plural handling
23. Add search suggestions/recent searches
24. Add Terms of Service link to register
25. Fix autofill background color clash
26. Add page transition animations
27. Add confirmation on sign-out
28. Add "Change photo" label when photo exists
