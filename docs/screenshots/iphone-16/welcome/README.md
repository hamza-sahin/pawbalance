# Welcome Flow

## Flow Overview

The Welcome screen is the first thing unauthenticated users see when they open PawBalance. It serves as a landing page that communicates the app's value proposition and funnels users into either account creation (via Onboarding) or sign-in (via Login).

**Entry point:** This screen is shown when users have no active session. It lives at `/welcome` as a standalone page outside both the `(auth)` and `(app)` route groups -- it has no shared layout chrome, no bottom navigation, and no card wrapper.

**Route:** `src/app/welcome/page.tsx`

---

## Screens

### Welcome

![Welcome screen](welcome.png)

**Purpose:** Introduce PawBalance's value proposition and guide new or returning users to the appropriate next step.

**Key Elements:**
- PawBalance app icon (80x80, rounded-[22px]) centered near the top with a subtle drop shadow
- "Welcome to PawBalance" heading in bold 3xl text, centered
- Subtitle text: "Everything you need to keep your dog safe and well-fed, all in one place." in secondary color, centered, constrained to max-w-xs
- Three benefit items listed vertically, each consisting of:
  - A 36x36 rounded-xl icon container with `primary/10` background
  - An 18x18 icon in `primary-dark` color (search, paw, and safe/shield icons)
  - Benefit description text in `text-sm text-txt`
- The three benefits are:
  1. "Search which foods are safe for your dog" (search icon)
  2. "Get personalized nutrition recommendations" (paw icon)
  3. "Know what's safe, what needs caution, and what to avoid" (shield/safe icon)
- Full-width sage green "Get Started" CTA button at the bottom with rounded-button corners, semi-bold white text, and a pressed-state scale animation
- "Already have an account? Sign In" secondary text link below the CTA

**Interactions:**
- "Get Started" button navigates to `/onboarding` (pet creation wizard)
- "Sign In" text link navigates to `/login?redirect=/search`
- The "Get Started" button has an active state with `scale-[0.97]` and reduced opacity for tactile feedback
- Focus-visible ring on the CTA for keyboard accessibility

**Transitions:**
- "Get Started" -> Onboarding flow (`/onboarding`)
- "Sign In" -> Login screen (`/login?redirect=/search`)

---

## State Variations

| State | Behavior |
|-------|----------|
| **Default** | Static screen with no loading states; all content is rendered immediately client-side |
| **Button pressed** | "Get Started" button scales to 97% and reduces opacity briefly via CSS transitions |
| **Authenticated user** | This page does not have its own auth guard. If a user with an active session navigates here, the page still renders. (Auth redirect is handled at the app level or when the user reaches protected routes.) |

---

## UI/UX Improvement Suggestions

### Critical

- **The "Sign In" link lacks accessible focus styles.** The secondary "Sign In" button uses `focus-visible:underline focus-visible:outline-none` but does not provide a visible focus ring. The `outline-none` actively removes the browser's default focus indicator. Keyboard and switch-control users have no way to see that this element is focused. Replace with `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` to match the CTA button's focus treatment.

- **Benefit icons have `aria-hidden="true"` but the icon containers have no accessible label.** This is actually correct behavior since the adjacent text serves as the label. However, the entire benefit row is not grouped semantically. Wrapping each benefit in a `<div role="listitem">` inside a `<div role="list">` (or using `<ul>/<li>`) would give screen readers proper structural context for the list of benefits.

### High

- **Large empty space between benefits and the CTA button.** On the iPhone 16 screenshot, there is a significant gap (roughly 200px) between the last benefit item and the "Get Started" button. This dead space makes the CTA less prominent and disconnects it from the value proposition. The current layout uses `justify-between` on the outer container, which pushes the CTA to the bottom. Consider using `justify-center` with a fixed bottom section, or adding additional content (e.g., a trust signal, a small illustration, or a user count) to fill the gap.

- **No visual hierarchy differentiation between the three benefits.** All three benefit items have identical styling -- same icon size, same container size, same text size. The first benefit ("Search which foods are safe") is arguably the primary value proposition and could be given more visual weight (e.g., slightly larger icon, bold text, or a subtle background card) to create a visual hierarchy.

- **No redirect guard for authenticated users.** Unlike the auth layout which checks for an existing session and redirects, the Welcome page renders regardless of auth state. A logged-in user who bookmarks or navigates to `/welcome` will see the onboarding pitch. Add a session check that redirects authenticated users to `/search`.

### Medium

- **Benefit text uses `text-sm` (14px) which is on the small side for a hero/landing screen.** On a landing page where the goal is to sell the user on the app's value, the benefit descriptions should be more prominent. Bumping to `text-base` (16px) would improve readability and give the benefits more visual weight, aligning with the recommended minimum of 16px for mobile body text.

- **The subtitle text is `text-sm` and constrained to `max-w-xs`.** The subtitle "Everything you need to keep your dog safe and well-fed, all in one place." wraps to two lines on the iPhone 16 screen. At 14px, this secondary text is readable but could be more impactful at `text-base` with slightly looser `max-w-sm` constraints.

- **No animation or progressive reveal for benefit items.** The screen is entirely static. Adding a staggered fade-in animation for the three benefit items (e.g., 100ms delay between each) would draw the user's attention sequentially through the value proposition and make the screen feel more polished. This should respect `prefers-reduced-motion`.

- **"Get Started" button has no icon.** Adding a right-facing arrow or chevron icon after the "Get Started" text would reinforce the forward-navigation affordance and make the CTA feel more actionable. This is a common pattern on mobile onboarding screens.

- **App icon uses generic `shadow-md`.** The icon shadow is a standard Tailwind utility shadow that may appear too diffuse on the light canvas background. A tighter, more intentional shadow (e.g., `shadow-[0_4px_12px_rgba(0,0,0,0.08)]`) would look more refined and match the subtle design language of the rest of the app.

- **No i18n consideration visible in the layout.** The screen handles i18n via `next-intl` translations, which is correct. However, Turkish translations tend to be longer than English. The `max-w-xs` constraint on subtitle and benefit text may cause awkward wrapping in Turkish. Testing with Turkish strings or using `max-w-sm` would be more resilient.
