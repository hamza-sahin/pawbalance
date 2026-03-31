# Terms of Service & Privacy Policy — Design Spec

**Date:** 2026-03-31
**Status:** Approved
**Author:** Brainstorming session

## Problem

PawBalance needs Terms of Service and Privacy Policy documents plus an in-app acceptance gate to comply with Apple App Store Review Guidelines (5.1.1) before publishing. The acceptance behavior differs by platform:

- **iOS (native):** All users — including guests — must accept before using the app
- **Web:** Only authenticated users must accept after login

## Solution: Full-Screen Blocking Page

A dedicated `/terms` route acts as a gate. Legal documents are served as in-app pages that double as public URLs for App Store Connect metadata.

---

## 1. New Routes

| Route | Purpose | Layout |
|---|---|---|
| `/terms` | Acceptance gate page | Standalone (no bottom nav) |
| `/terms-of-service` | Full ToS document | Standalone (no bottom nav) |
| `/privacy-policy` | Full Privacy Policy document | Standalone (no bottom nav) |

All three routes are **ungated** — accessible without terms acceptance.

## 2. Gate Logic

**Location:** `src/app/(app)/layout.tsx`

Gate order (first to last):
1. **Terms gate** (new)
2. Onboarding gate (existing)
3. Access gate (existing)

**Terms gate logic:**
```
function shouldRequireTerms():
  if isNative:
    // iOS: always check, guest or authenticated
    if authenticated:
      return user_metadata.accepted_terms_version < CURRENT_TERMS_VERSION
    else:
      return localStorage.accepted_terms_version < CURRENT_TERMS_VERSION
  else:
    // Web: only check if authenticated
    if authenticated:
      return user_metadata.accepted_terms_version < CURRENT_TERMS_VERSION
    else:
      return false

if shouldRequireTerms() → redirect to /terms
```

**Constant:** `CURRENT_TERMS_VERSION = 1` in `src/lib/constants.ts`

## 3. Terms Acceptance Page (`/terms`)

**UI:**
- App logo at top
- Heading: "Terms & Conditions" (or "We've Updated Our Terms" for re-consent)
- Summary text: "Please review and accept our terms to continue"
- Two tappable rows linking to full documents:
  - "Terms of Service" → `/terms-of-service`
  - "Privacy Policy" → `/privacy-policy`
- Checkbox: "I have read and agree to the Terms of Service and Privacy Policy"
- "Continue" button — disabled until checkbox is checked
- All text i18n'd (EN + TR)

**On acceptance:**
1. If authenticated → update `user_metadata.accepted_terms_version` via Supabase `auth.updateUser()`
2. If guest on iOS → `localStorage.setItem("accepted_terms_version", CURRENT_TERMS_VERSION)`
3. Redirect to intended route or `/search`

## 4. Legal Document Pages

**`/terms-of-service` and `/privacy-policy`:**
- Scrollable standalone pages with back navigation
- Content as JSX components (not markdown) — compatible with static export and i18n
- Both EN and TR via `next-intl`
- Back button returns to `/terms` (if coming from gate) or previous page

### Terms of Service Content

- **Operator:** Hamza Sahin, Rotermanni 7, Tallinn 10111, Estonia
- **Contact:** hamiissah@gmail.com
- **Service description:** Pet nutrition reference app — informational only, not veterinary advice
- **Eligibility:** Age 13+ (or with parental consent)
- **User accounts:** Responsibility for credentials, one account per person
- **Acceptable use:** No scraping, abuse, or commercial redistribution of food data
- **Intellectual property:** All content (food database, UI) owned by operator
- **Disclaimer:** Food safety information is general guidance — consult a veterinarian for medical decisions
- **Limitation of liability:** No liability for pet health outcomes based on app information
- **Termination:** Operator may suspend accounts for violations
- **Governing law:** Laws of Estonia
- **Changes to terms:** Users notified via in-app re-consent gate

### Privacy Policy Content

**Data collected:**
| Data Type | What | Storage |
|---|---|---|
| Account | Email, display name, avatar URL | Supabase Auth (user_metadata) |
| Pet data | Name, breed, weight, age, gender, neutered status, BCS, activity level, photos | Supabase DB + Storage |
| Food requests | Food name, status | Supabase DB |
| Preferences | Language (en/tr) | Cookie (1 year) + localStorage |
| Device telemetry | App version, device ID | Capgo (iOS only) |

**How data is used:**
- Account management and authentication
- Pet nutrition lookups and food safety information
- Food database improvement (via food requests)
- App updates delivery (via Capgo, iOS only)

**Third-party services:**
| Service | Purpose | Data Shared |
|---|---|---|
| Supabase | Database, auth, file storage | All account + pet data |
| Google OAuth | Authentication | Email, name, avatar |
| Apple Sign-In | Authentication (iOS) | Email, name |
| Capgo | OTA updates (iOS) | Device ID, app version |

**Additional disclosures:**
- Pet photos stored with publicly accessible URLs in Supabase Storage
- Locale preference cookie (1 year expiry)
- Supabase session cookies (automatic)
- No behavioral analytics, advertising, or third-party tracking
- Data retained until user deletes account or pet records
- GDPR user rights: access, rectification, deletion, portability — contact hamiissah@gmail.com
- Not directed at children under 13
- Changes notified via in-app re-consent gate

## 5. Acceptance Storage

**No new Supabase tables.** Uses existing mechanisms:

| User Type | Storage | Key | Value |
|---|---|---|---|
| Authenticated | `user_metadata` | `accepted_terms_version` | number (e.g., `1`) |
| Guest (iOS) | `localStorage` | `accepted_terms_version` | string number (e.g., `"1"`) |

## 6. Guest-to-Authenticated Sync

When a guest signs up or logs in (existing sync point in `use-auth.ts` / `use-pets.ts`):
1. Read `localStorage.accepted_terms_version`
2. Write to `user_metadata.accepted_terms_version` via `auth.updateUser()`
3. Clear `localStorage.accepted_terms_version`

## 7. Re-Consent Flow

When terms are updated:
1. Bump `CURRENT_TERMS_VERSION` in `src/lib/constants.ts`
2. All users see the gate again (version comparison fails)
3. Acceptance page shows "We've Updated Our Terms" heading variant
4. On accept, `accepted_terms_version` updated to new value

## 8. Routes NOT Gated

These routes must remain accessible without terms acceptance:
- `/terms`, `/terms-of-service`, `/privacy-policy`
- `/welcome`
- `/login`, `/register`, `/forgot-password`

## 9. App Store Connect

Update metadata fields:
- **Privacy Policy URL:** `https://pawbalance.optalgo.com/privacy-policy`
- **Terms of Service URL:** `https://pawbalance.optalgo.com/terms-of-service`

## 10. i18n Keys

New keys needed in `en.json` and `tr.json`:
- `terms.title`, `terms.updatedTitle`, `terms.subtitle`
- `terms.tosLink`, `terms.privacyLink`
- `terms.checkbox`, `terms.continue`
- `terms.backButton`
- Full ToS document text (EN + TR)
- Full Privacy Policy document text (EN + TR)

## 11. Platform Behavior Summary

| Scenario | iOS Guest | iOS Authenticated | Web Authenticated | Web Guest |
|---|---|---|---|---|
| First launch | Gate shown | Gate shown | Gate shown after login | No gate |
| Terms accepted | Can use app | Can use app | Can use app | N/A |
| Terms updated | Gate re-shown | Gate re-shown | Gate re-shown | No gate |
| Storage | localStorage | user_metadata | user_metadata | N/A |

## 12. Files Changed

| File | Change |
|---|---|
| `src/lib/constants.ts` | Add `CURRENT_TERMS_VERSION` |
| `src/app/(app)/layout.tsx` | Add terms gate (before onboarding gate) |
| `src/app/terms/page.tsx` | New — acceptance page |
| `src/app/terms-of-service/page.tsx` | New — full ToS document |
| `src/app/privacy-policy/page.tsx` | New — full Privacy Policy document |
| `src/hooks/use-auth.ts` | Sync guest terms acceptance on login/signup |
| `src/messages/en.json` | Add all terms/privacy i18n keys |
| `src/messages/tr.json` | Add all terms/privacy i18n keys (Turkish) |

## Out of Scope

- Custom EULA (Apple's standard EULA applies)
- Cookie consent banner (only one functional cookie, no tracking)
- Account deletion flow (separate feature, already noted in CLAUDE.md)
- Android-specific behavior
