# iOS Safe Area and App Shell Layout — Design Spec

**Date:** 2026-04-17
**Status:** Approved for Planning

## Overview

PawBalance has two systemic mobile layout bugs on iOS:

1. Some regular app screens let visible content drift into the status-bar / notch area.
2. Some tabbed screens reserve bottom space more than once, leaving a large empty block above the bottom navigation bar.

This spec defines a single viewport-shell contract for the app so safe-area handling, header chrome, bottom-nav chrome, and scroll bounds are owned in one place instead of being reimplemented by each page.

The goal is a permanent fix across every app route, viewport size, and supported mobile device class.

## Approved Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Fix scope | Shared app-shell contract | Current bugs are systemic, not page-specific |
| Bottom-nav behavior | Tab bar background extends to physical device bottom | Matches native iOS expectations; no separate canvas strip below it |
| Content boundary | Scrollable content stops at tab bar visual top edge | Prevents fake empty space above nav |
| Safe-area ownership | Shell owns all top/bottom inset math | Prevents duplicate padding and route drift |
| Route modeling | Three shell modes: `tabbed`, `stacked`, `immersive` | Covers all current route patterns without ad-hoc exceptions |
| Viewport sizing | `100dvh`-based shell sizing where full viewport math is needed | Avoids `100vh` issues on iOS browser/webview chrome changes |
| Native plugin changes | CSS shell first; native StatusBar override only if runtime still misreports overlay behavior | Current failures are primarily layout duplication, not lack of a native API |

## Current Findings

### Observed app behavior

- `src/app/(app)/layout.tsx` adds bottom reserve when bottom nav is visible.
- `src/components/navigation/app-screen.tsx` adds bottom reserve again through `screen-body-with-tabbar`.
- Multiple route pages add further inner padding such as `pb-20` or viewport-height compensation.
- Some screens still use `100vh`, `min-h-screen`, or `calc(100vh - ...)`, which is fragile on iOS.
- Top-safe handling is inconsistent between header screens, headerless screens, and immersive/centered flows.

### Concrete examples

- `Learn` and `Category Browse` screenshots show content entering unsafe top space.
- `Profile` and `Recipe Analysis` screenshots show excessive blank space above the bottom nav.

## Goals

- No regular route renders visible content under the iOS notch, status bar, bottom nav, or home indicator.
- Bottom navigation background reaches the physical bottom edge of the screen.
- Scrollable content ends at the top edge of the visible bottom nav, not above it by an arbitrary spacer.
- Page authors no longer need to think about safe-area math.
- The same contract works on iPhone SE-class screens, Dynamic Island devices, iPads, and Android cutout devices.

## Non-Goals

- Redesigning the visual style of the header or tab bar.
- Reworking route information architecture.
- Changing modal, sheet, or paywall product behavior beyond safe-area compliance.
- Fixing every full-height pattern outside the app shell in one unrelated sweep.

## Best-Practice Basis

This design follows current platform guidance:

- WebKit: with `viewport-fit=cover`, important content must apply safe-area insets selectively rather than relying on automatic browser padding.
- MDN: `env(safe-area-inset-*)` values are dynamic and device-dependent; on rectangular screens they resolve to `0`.
- MDN guidance for fixed toolbars/footers supports combining base spacing with `env(safe-area-inset-bottom)`.
- Capacitor Status Bar docs confirm overlay behavior is configurable on iOS, but the webview/shell layout still must account for whether content extends beneath the status bar.

References:

- WebKit, *Designing Websites for iPhone X*: https://webkit.org/blog/7929/designing-websites-for-iphone-x/
- MDN, `env()` CSS function: https://developer.mozilla.org/en-US/docs/Web/CSS/env
- MDN, using CSS environment variables: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Environment_variables/Using
- Capacitor Status Bar API: https://capacitorjs.com/docs/apis/status-bar

## Shell Architecture

### Single owner model

The viewport shell is the single owner of:

- top safe area
- bottom safe area
- header height
- bottom-nav visible height
- bottom-nav safe-area extension
- scroll container bounds

Regular route pages do not own any of those values.

### Shared shell variables

The app shell exports reusable CSS custom properties:

- `--safe-top`
- `--safe-bottom`
- `--header-height`
- `--tabbar-visual-height`
- `--tabbar-total-height`
- `--content-top`
- `--content-bottom`
- `--app-shell-height`

These derive from a combination of design constants and `env(safe-area-inset-*)` values, with safe fallbacks.

### Chrome behavior

#### Top chrome

- Header background may extend into the top safe area.
- Header content row starts below the top safe area.
- On routes without a visible header, the shell still provides safe-top clearance before first content.

#### Bottom chrome

- Bottom-nav background extends to the physical bottom edge.
- The home-indicator inset is absorbed inside the nav background, not rendered as separate page canvas.
- Scrollable content stops at the top edge of the visible nav body.

### Content slot

The content area is a single bounded scroll slot between top and bottom chrome. It must not be compensated again inside route pages.

Regular routes must not use:

- page-level tab-bar padding
- `pb-20` / `pb-*` nav compensation
- `screen-body-with-tabbar`
- `100vh`
- `min-h-screen`
- `calc(100vh - ...)`

for shell-spacing purposes.

## Route Modes

Only three shell modes are allowed.

### `tabbed`

Used for main app tabs such as:

- `/profile`
- `/learn`
- `/search`
- `/recipes`
- `/scan`

Behavior:

- visible header
- visible bottom nav
- bounded scroll slot between them

### `stacked`

Used for deeper subpages such as:

- pets
- language
- support
- article detail
- food detail

Behavior:

- visible header
- no bottom nav
- bounded scroll slot from header to bottom safe area

### `immersive`

Used for:

- welcome
- onboarding
- auth
- terms-like full-page flows

Behavior:

- header optional
- bottom nav hidden
- still respects safe top and safe bottom
- vertically centered layouts use shell slot sizing, not raw viewport height

## Exception Rules

- Modals, sheets, and dialogs may overlay route chrome.
- Their internal content must still respect safe-area insets.
- No regular route may bypass shell spacing.
- No page may manually add tab-bar compensation.
- Loading states and empty states inherit the same shell slot as the route they belong to.

## Component Ownership

### `src/app/(app)/layout.tsx`

Responsible for:

- selecting shell mode per route
- exposing shared shell classes / variables
- mounting bottom nav when applicable

Must stop doing:

- route-level duplicate bottom padding compensation

### `src/components/navigation/app-screen.tsx`

Responsible for:

- rendering header chrome
- rendering bounded content slot

Must stop doing:

- bottom-nav spacing ownership

### `src/components/navigation/bottom-nav.tsx`

Responsible for:

- visible nav layout
- bottom safe-area absorption inside nav background

### Route pages

Responsible only for route content.

Must stop doing:

- `pb-20`
- shell-height hacks
- manual notch compensation

## Native Status Bar Strategy

Primary fix path is CSS/app-shell cleanup.

Reason:

- current failures clearly show duplicated ownership in React/CSS layout
- safe-area logic is already partly present
- CSS ownership must be correct regardless of native status-bar overlay settings

Secondary fallback:

- if the iOS native build still reports unexpected overlay behavior after shell cleanup, add `@capacitor/status-bar` configuration or runtime control as a narrow follow-up
- if used, the preferred default for normal app screens is non-ambiguous behavior: either shell intentionally supports overlay and compensates fully, or the webview is not overlaid
- the repo does not currently install `@capacitor/status-bar`, so this is not part of the first implementation slice

## Implementation Plan Shape

The implementation plan should produce the fix in this order:

1. define shell variables and route modes
2. remove duplicate bottom spacing ownership from app layout and `AppScreen`
3. move bottom safe-area ownership fully into `BottomNav`
4. replace route-level viewport hacks and extra bottom padding
5. update immersive flows to use shell slot sizing
6. add regression tests

## Verification Requirements

### Automated

- tests for shell mode selection
- tests for bottom-nav visibility rules
- tests proving layout no longer adds duplicate route-level safe-top / safe-bottom classes
- tests covering representative `tabbed`, `stacked`, and `immersive` routes

### Manual / visual

Validate on:

- iPhone with Dynamic Island
- smaller iPhone viewport / home-button-class viewport
- iPad
- Android cutout device

Validate route types:

- tab root list page
- stacked detail page
- immersive centered page
- bottom sheet over tabbed page

### Success criteria

- no visible content under top unsafe area on regular screens
- no large blank block above bottom nav on regular tabbed screens
- bottom nav visually reaches device bottom
- adding or removing bottom nav changes shell math in one place only

## Guardrails

- Document the shell contract directly near the shell code.
- Prefer shell-mode APIs over page-level CSS exceptions.
- Treat new uses of `100vh`, `min-h-screen`, `pb-20`, or manual safe-area classes in app routes as regressions unless explicitly justified for a non-route overlay.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Some centered auth/onboarding screens currently rely on `min-h-screen` | Migrate them to shell-slot centering in the same change |
| Deep routes may have hidden assumptions about bottom spacing | Cover representative stacked routes in tests |
| Bottom sheets may appear correct on one device and wrong on another | Verify sheet inner padding separately from page shell |
| Native iOS runtime may still behave differently than browser screenshots | Validate on simulator/device after CSS cleanup and only then consider StatusBar plugin changes |

## Out of Scope Follow-Up

Possible later cleanup after this feature lands:

- lint or codemod check for banned shell-spacing patterns
- route metadata abstraction for shell mode declarations
- dedicated visual regression coverage for app-shell screenshots
