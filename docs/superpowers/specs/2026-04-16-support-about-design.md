# Support and About Design Spec

**Date:** 2026-04-16  
**Status:** Proposed and user-approved

## Summary

Add two dedicated profile subpages for support and app information, and remove the unused settings button from the profile header.

The new `Help & Support` page will provide:
- A visible support email address: `2gurmepati@gmail.com`
- A primary action to open the user's mail app
- Help/legal shortcuts
- A support request form that builds a prefilled `mailto:` draft

The new `About` page will provide:
- A short app summary
- A mission/value statement
- App version information
- Founder/operator/contact details
- Legal links

This work stays within the existing profile information architecture and does not require backend changes.

## Goals

- Turn the current dead `Help & Support` and `About` rows into real destinations
- Give users a clear path to contact support
- Add trustworthy product/company context without bloating the profile screen
- Remove the misleading top-right settings button from the profile screen

## Non-Goals

- Building a backend-backed support ticket system
- Adding in-app chat or real-time support
- Creating a large standalone FAQ knowledge base
- Introducing a new public marketing/about page outside the authenticated profile flow

## Existing Context

- `src/app/(app)/profile/page.tsx` already groups support-related rows under a `Support` section
- `Help & Support` and `About` currently render as dead `#` links
- Terms and privacy already exist as standalone pages and should be reused as support/legal destinations
- The authenticated profile header includes a top-right settings icon with no behavior; it should be removed

## Recommended Approach

Create two dedicated pages linked from the existing support group in profile:

1. `Help & Support`
2. `About`

This approach preserves the current navigation pattern, matches the app's existing standalone policy pages, and leaves room to expand content later without overloading the main profile screen.

## Information Architecture

### Profile Screen

- Keep the existing `Support` group on the authenticated profile page
- Update the `Help & Support` row to route to a dedicated support page
- Update the `About` row to route to a dedicated about page
- Remove the top-right settings button from the authenticated profile header
- Do not replace the removed settings button with another control

### Routing

Preferred routes:

- `/profile/support`
- `/profile/about`

These routes fit the existing profile subpage structure such as `/profile/language` and `/profile/pets`.

## Screen Design

### Help & Support Page

The page should use the app's existing card-based mobile layout and stay concise.

Sections:

1. Contact
- A support card with the email address `2gurmepati@gmail.com`
- A primary CTA labeled along the lines of `Email Support`
- Tapping the CTA opens the user's default mail app with `mailto:2gurmepati@gmail.com`

2. Support Request
- A lightweight in-app form with:
  - Subject
  - Message
- Submit action does not save data locally or remotely
- Submit action opens the mail app using a prefilled `mailto:` link

3. Help Shortcuts
- Link cards to:
  - Terms of Service
  - Privacy Policy
- Avoid filler FAQ copy
- If a small FAQ/help block is added later, it must be based on real support content, not placeholder text

### About Page

The page should feel informational and trustworthy rather than promotional.

Sections:

1. App Summary
- Short description of what PawBalance helps users do

2. Mission
- Short statement about helping pet owners make safer food and nutrition decisions

3. Version
- Show app version/build information from runtime or package metadata
- Do not hardcode version copy into the component body

4. Founder / Operator
- Show founder/operator identity and contact context
- Reuse existing legal/operator facts where appropriate for consistency

5. Legal
- Link cards to:
  - Terms of Service
  - Privacy Policy

## Interaction Design

### Support Email Launch

- Primary support CTA uses `mailto:2gurmepati@gmail.com`
- Support request form submit also uses `mailto:2gurmepati@gmail.com`
- The generated email should include:
  - A clear subject prefix, such as `PawBalance Support:`
  - The user's entered subject
  - The user's entered message
  - Helpful context in the body when available:
    - App version
    - Locale

### Validation

Support form validation rules:

- Subject is required
- Message is required
- Validation errors appear inline
- Submit is blocked until required fields are present

### Failure Handling

- If the app cannot open the mail client, show a visible fallback state
- The fallback must keep `2gurmepati@gmail.com` visible on screen so the user can copy it manually
- Do not silently fail

## Content and Localization

- All new labels, descriptions, validation messages, and section headings must be localized
- Add keys in both:
  - `src/messages/en.json`
  - `src/messages/tr.json`
- Copy should be short, plain, and trustworthy
- Avoid exaggerated claims or marketing-heavy language

## Accessibility

- Keep rows and action cards full-width and easily tappable
- Use explicit labels for support form inputs
- Show visible focus states on interactive elements
- Use inline error text for validation
- Keep the email address visible as readable text, not just an icon button

## Technical Notes

- No backend or database changes
- No new API routes
- Version information should come from an existing metadata source if available; otherwise use a controlled fallback that does not misstate the version
- Existing legal pages should be reused rather than duplicated

## Testing Strategy

### Automated

- Add or update tests for profile support/about links
- Add or update tests for support form validation
- Add or update tests that the support form generates the expected `mailto:` payload
- Verify both locale files contain all required new message keys

### Manual

- Verify profile page no longer shows the unused settings button
- Verify `Help & Support` and `About` rows navigate correctly
- Verify mail app launch behavior from:
  - Direct email CTA
  - Support request form submit
- Verify fallback behavior when mail app launch fails
- Verify layout and copy in both English and Turkish
- Verify long Turkish strings still fit the card layout cleanly

## Files Likely Affected

- `src/app/(app)/profile/page.tsx`
- `src/app/(app)/profile/support/page.tsx`
- `src/app/(app)/profile/about/page.tsx`
- `src/messages/en.json`
- `src/messages/tr.json`
- Related test files for profile/support behavior

## Scope Check

This is small enough for a single implementation plan and does not need decomposition into separate projects.
