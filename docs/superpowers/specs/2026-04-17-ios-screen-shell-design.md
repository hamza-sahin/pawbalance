# Global iOS Screen Shell Design Spec

**Date:** 2026-04-17  
**Status:** Proposed and user-approved

## Summary

Introduce one global full-page screen shell that owns top chrome, safe-area behavior, header rendering, and scroll layout for all full-page routes.

The shell will:
- Apply a single consistent header contract across the app
- Render a joined safe-area header on iOS only
- Keep non-iOS routes on the same component path with a plain header mode
- Eliminate route-level `safe-top`, `sticky top-0`, and ad-hoc back rows from full-page routes

This change is a structural UI fix, not a visual redesign of page content.

## Goals

- Fix status-bar overlap on iOS comprehensively rather than page by page
- Make every full-page route use one shared header and scroll model
- Ensure tab-root and stacked/detail screens follow the same screen-shell contract
- Prevent future regressions by removing page-owned top chrome decisions

## Non-Goals

- Redesigning cards, content blocks, forms, or bottom sheets
- Introducing Android-specific native chrome behaviors in this pass
- Changing modal, dialog, paywall, or bottom-sheet layout systems
- Reworking page information architecture beyond header and screen-shell structure

## Existing Context

- Full-page routes currently mix multiple top-of-screen patterns:
  - route-level `safe-top`
  - custom flex header rows
  - `sticky top-0` headers
  - inline text links like `← Back`
  - pages with no explicit header at all
- Some screens use icon back buttons while others use text links
- Some scrollable screens place the header inside the scroll flow while others do not
- The app already has native/web platform helpers in `src/lib/platform.ts`, but it currently exposes only generic native detection, not an explicit iOS check
- Bottom navigation exists at the app layout level, so screen bodies need predictable bottom spacing

## Root Cause

The overlap bug is not caused by one broken page. The underlying problem is that top chrome is implemented independently in many routes.

That creates three competing layout owners:
- outer safe-area padding
- route-local header rows
- route-local scroll containers

Because those responsibilities are split across pages, iOS safe-area behavior becomes inconsistent and easy to break. The correct fix is to give one component ownership of the full-page screen frame.

## Recommended Approach

Create a shared `AppScreen` shell in `src/components/navigation/app-screen.tsx` and migrate all full-page routes to it.

The shell will own:
- top safe-area treatment
- header rendering
- back-button placement
- optional trailing action slot
- scroll container structure
- body padding for bottom-nav pages

Pages will stop rendering their own top chrome and instead pass metadata into the shell.

## Screen Shell Contract

### Core API

The shell API should stay small and explicit. Expected props:

- `title`
- `showBack`
- `onBack`
- `backHref`
- `trailing`
- `scrollable`
- `contentClassName`
- `withBottomNavSpacing`
- `children`

Navigation rule:
- pages may pass `backHref` for declarative navigation or `onBack` for imperative navigation
- pages must not pass both for the same screen

### Layout Ownership

The shell will render two layers:

1. `chrome`
- owns safe-area inset and header row
- never delegated to page files

2. `body`
- owns page scroll behavior
- hosts the route content

No full-page route should render its own competing top-level scroll header once migrated.

## Platform Behavior

### iOS

On iOS native only:
- the header background extends into the top safe-area inset
- the safe-area inset and header row visually read as one joined block
- the title and controls render below the unsafe area
- content starts below the complete chrome block and never scrolls underneath it

This is the required default for all full-page routes on iOS.

### Non-iOS

On non-iOS:
- use the same shell component
- render a plain top header mode without iOS-specific inset chrome
- avoid platform-specific page code

This keeps architecture unified and prevents route drift between platforms.

### Platform Detection

Add an explicit iOS-native helper in `src/lib/platform.ts`, based on Capacitor platform detection, so screen chrome can key off `ios` directly rather than generic native mode.

## Header Behavior

- The header is always rendered by the shell for full-page routes
- Back tap target must be at least `44x44`
- Header title must remain visually centered
- If a trailing action exists, its slot must preserve title centering
- If there is no trailing action, render an equal-width spacer rather than letting the title drift

### Tab Root Screens

These should use the global shell with `title` and no back button:

- `/recipes`
- `/search`
- `/learn`
- `/profile`
- `/scan`

### Stacked / Detail Screens

These should use the global shell with `title` and back behavior:

- `/recipes/new`
- `/recipes/edit`
- `/recipes/analysis`
- `/search/category`
- `/search/food`
- `/learn/article`
- `/profile/about`
- `/profile/support`
- `/profile/language`
- `/profile/pets`
- `/profile/pets/edit`
- `/profile/scan-history`
- `/privacy-policy`
- `/terms-of-service`
- `/terms`

### Standalone Full Pages

These should also move onto the same shell:

- `/welcome`
- `/onboarding`
- `/login`
- `/register`
- `/forgot-password`

Their content may remain centered or card-based inside the shell body, but the page frame must still come from the shared shell.

## Scroll and Spacing Rules

- The shell body is the default scroll owner for full-page routes
- Header remains outside the scrollable body
- Full-page routes should not keep ad-hoc top-level sticky headers
- Nested scrolling is allowed only for genuinely nested UI elements such as chips lists, dropdowns, or sheets
- Bottom-nav spacing is applied by the shell or screen-frame contract, not repeated ad hoc in page files
- Layout should use a flex-safe structure (`min-h-0` where needed) so the header and body do not fight over height

## Migration Rules

For every migrated full-page route:

- remove route-level `safe-top`
- remove route-level `sticky top-0` headers
- remove inline `router.back()` button rows that duplicate shell behavior
- remove text links such as `← Back`
- keep only page-specific content inside the shell body

After migration, page files should decide only:
- title
- back/no-back
- optional trailing action
- page body content

They must not decide top safe-area layout or top chrome structure.

## Accessibility and UX Requirements

- Back buttons and trailing actions must remain at least `44x44`
- Focus-visible styles must remain visible for interactive header elements
- Header titles should not be visually offset by missing leading/trailing controls
- iOS joined-header behavior must not create hidden or unreachable controls
- Non-iOS output must remain visually stable and not inherit broken iOS spacing assumptions

## Regression Protection

- `AppScreen` becomes the required entry point for new full-page routes
- Existing `PageHeader` should either be removed or reduced to a private internal building block beneath the shell
- Safe-area tokens and helper classes should be centralized in `src/app/globals.css`
- Platform branching for header chrome should remain inside shared navigation/shell code, not page files

## Testing Strategy

### Automated

- Add tests for shell rendering on iOS vs non-iOS
- Add tests for back-button presence/absence
- Add tests that the trailing slot keeps layout contract intact
- Add at least one regression test for a previously broken scrollable screen such as:
  - `/terms-of-service`
  - `/profile/about`
- Add or update tests for any page whose old route-local back link/header is removed
- Add a small platform utility test if an `isIOSNative` helper is introduced

### Manual

- Verify all migrated full-page routes on iOS
- Verify top chrome no longer overlaps status-bar content while scrolling
- Verify tab-root screens render the global header without back controls
- Verify detail screens render the global header with working back controls
- Verify non-iOS routes still look correct
- Verify bottom-nav screens still have sufficient bottom spacing

## Files Likely Affected

- `src/lib/platform.ts`
- `src/app/globals.css`
- `src/components/navigation/page-header.tsx` (remove or reduce to an internal building block)
- `src/components/navigation/app-screen.tsx` (new)
- `src/app/(app)/layout.tsx`
- Full-page route files listed above
- Affected route test files

## Implementation Boundaries

- Limit this work to full-page route shell structure and top chrome
- Do not redesign inner page content unless required to fit the new shell
- Do not change bottom sheets, dialogs, or paywall surfaces unless migration exposes an accidental dependency
- Do not expand this pass into Android-native visual treatment changes

## Scope Check

This is large enough to require a dedicated implementation plan, but still focused enough to remain one project. It does not need decomposition into multiple separate specs.
