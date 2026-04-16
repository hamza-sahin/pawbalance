# Support and About Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dedicated `Help & Support` and `About` profile pages, wire the existing profile links to those pages, remove the dead settings button, and support mail-app launching through visible support actions and a prefilled support request form.

**Architecture:** Keep the change inside the existing authenticated profile route tree. Reuse the app's current mobile page shell pattern from policy pages, add localized copy in both locale files, and isolate version lookup in a small shared utility so the About page does not hardcode release metadata. Implement support form behavior entirely client-side with `mailto:` generation and fallback UX instead of adding backend endpoints.

**Tech Stack:** Next.js App Router, React 19, next-intl, Vitest, Testing Library, TypeScript, Tailwind CSS.

---

## File Structure

### Existing files to modify

- `src/app/(app)/profile/page.tsx`
  Responsibility: authenticated profile landing screen; remove dead settings action and wire support/about rows to real routes.
- `src/messages/en.json`
  Responsibility: English copy for support page, about page, validation, fallback, and profile row labels if needed.
- `src/messages/tr.json`
  Responsibility: Turkish translations matching the new English keys.

### New files to create

- `src/app/(app)/profile/support/page.tsx`
  Responsibility: support/contact page with visible email CTA, legal/help shortcuts, and support request form.
- `src/app/(app)/profile/about/page.tsx`
  Responsibility: about page with summary, mission, version, operator details, and legal links.
- `src/lib/app-info.ts`
  Responsibility: central app metadata helper exposing version text sourced from `package.json`.
- `src/app/(app)/profile/__tests__/profile-page.test.tsx`
  Responsibility: verifies authenticated profile header/action changes and destination links.
- `src/app/(app)/profile/support/__tests__/page.test.tsx`
  Responsibility: verifies support page rendering, validation, and `mailto:` payload generation.
- `src/app/(app)/profile/about/__tests__/page.test.tsx`
  Responsibility: verifies about page content and version rendering.

## Task 1: Lock Profile Navigation Changes With Tests

**Files:**
- Create: `src/app/(app)/profile/__tests__/profile-page.test.tsx`
- Modify: `src/app/(app)/profile/page.tsx`
- Test: `src/app/(app)/profile/__tests__/profile-page.test.tsx`

- [ ] **Step 1: Write the failing profile test**

```tsx
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import ProfilePage from "../page";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    displayName: "Hamza",
    avatarUrl: null,
    user: { email: "hamza@example.com" },
    subscriptionTier: "FREE",
    signOut: vi.fn(),
    isAuthenticated: true,
  }),
}));

vi.mock("@/hooks/use-pets", () => ({
  usePets: () => ({ selectedPet: null }),
}));

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => ({ locale: "en" }),
}));

function renderProfilePage() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProfilePage />
    </NextIntlClientProvider>,
  );
}

describe("ProfilePage", () => {
  it("removes dead settings button and links support rows to real destinations", () => {
    renderProfilePage();

    expect(screen.queryByLabelText("Settings")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /help & support/i })).toHaveAttribute(
      "href",
      "/profile/support",
    );
    expect(screen.getByRole("link", { name: /about/i })).toHaveAttribute(
      "href",
      "/profile/about",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/'(app)'/profile/__tests__/profile-page.test.tsx`

Expected: FAIL because the settings button still exists and both links still point to `#`.

- [ ] **Step 3: Write minimal profile implementation**

```tsx
<div className="mb-6 flex items-center justify-between">
  <h1 className="text-lg font-bold text-txt">{t("profile")}</h1>
</div>

{[
  { href: "/profile/support", icon: Icons.help, label: t("helpAndSupport") },
  { href: "/profile/about", icon: Icons.info, label: t("about") },
].map((item) => (
  <Link key={item.label} href={item.href} className="block transition-all duration-150 ease-out active:scale-95 active:opacity-80">
    <Card className="flex items-center gap-3 p-4">
      <item.icon className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
      <span className="flex-1 font-medium text-txt">{item.label}</span>
      <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
    </Card>
  </Link>
))}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/'(app)'/profile/__tests__/profile-page.test.tsx`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(app)'/profile/page.tsx src/app/'(app)'/profile/__tests__/profile-page.test.tsx
git commit -m "feat: wire profile support navigation"
```

## Task 2: Add Central App Metadata Helper

**Files:**
- Create: `src/lib/app-info.ts`
- Create: `src/app/(app)/profile/about/__tests__/page.test.tsx`
- Test: `src/app/(app)/profile/about/__tests__/page.test.tsx`

- [ ] **Step 1: Write the failing about/version test**

```tsx
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import AboutPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

describe("AboutPage", () => {
  it("shows app version from shared app info metadata", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(/version/i)).toBeInTheDocument();
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/'(app)'/profile/about/__tests__/page.test.tsx`

Expected: FAIL because `AboutPage` does not exist yet and there is no shared metadata helper.

- [ ] **Step 3: Create the shared metadata helper**

```ts
import packageJson from "../../package.json";

type PackageJson = {
  version?: string;
};

const pkg = packageJson as PackageJson;

export const APP_VERSION = pkg.version ?? "";

export function getAppVersionLabel() {
  return APP_VERSION;
}
```

- [ ] **Step 4: Run test to verify helper import path works after About page exists**

Run: `npm test -- src/app/'(app)'/profile/about/__tests__/page.test.tsx`

Expected: still FAIL, but now due only to missing About page implementation rather than missing metadata utility.

- [ ] **Step 5: Commit**

```bash
git add src/lib/app-info.ts src/app/'(app)'/profile/about/__tests__/page.test.tsx
git commit -m "test: add about page version coverage"
```

## Task 3: Build the About Page

**Files:**
- Create: `src/app/(app)/profile/about/page.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`
- Test: `src/app/(app)/profile/about/__tests__/page.test.tsx`

- [ ] **Step 1: Expand the failing test to cover core about content**

```tsx
expect(screen.getByRole("heading", { name: /about/i, level: 1 })).toBeInTheDocument();
expect(screen.getByText(/everything you need to keep your dog safe/i)).toBeInTheDocument();
expect(screen.getByText(/help pet owners make safer food/i)).toBeInTheDocument();
expect(screen.getByText(/hamza sahin/i)).toBeInTheDocument();
expect(screen.getByRole("link", { name: /terms of service/i })).toHaveAttribute(
  "href",
  "/terms-of-service",
);
expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
  "href",
  "/privacy-policy",
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/'(app)'/profile/about/__tests__/page.test.tsx`

Expected: FAIL because localized copy and page UI are not implemented.

- [ ] **Step 3: Add localized copy for About page**

```json
{
  "aboutSummaryTitle": "What PawBalance Does",
  "aboutSummaryBody": "PawBalance helps dog owners quickly check food safety, explore nutrition guidance, and keep pet profiles in one place.",
  "aboutMissionTitle": "Mission",
  "aboutMissionBody": "Our mission is to help pet owners make safer, more confident food and nutrition decisions for their dogs.",
  "aboutVersionTitle": "Version",
  "aboutOperatorTitle": "Founder & Operator",
  "aboutOperatorBody": "PawBalance is created and operated by Hamza Sahin.",
  "aboutContactTitle": "Contact",
  "aboutLegalTitle": "Legal"
}
```

- [ ] **Step 4: Implement the page using existing policy-page shell**

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { getAppVersionLabel } from "@/lib/app-info";

export default function AboutPage() {
  const t = useTranslations();
  const router = useRouter();
  const version = getAppVersionLabel();

  return (
    <div className="safe-top mx-auto min-h-screen max-w-md bg-canvas">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:bg-border/50"
          aria-label={t("back")}
        >
          <Icons.arrowLeft className="h-5 w-5 text-txt" />
        </button>
        <h1 className="text-lg font-bold text-txt">{t("about")}</h1>
      </div>

      <div className="space-y-6 px-4 py-6">
        <section>
          <h2 className="text-base font-semibold text-txt">{t("aboutSummaryTitle")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-txt-secondary">{t("aboutSummaryBody")}</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-txt">{t("aboutMissionTitle")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-txt-secondary">{t("aboutMissionBody")}</p>
        </section>

        {version && (
          <section>
            <h2 className="text-base font-semibold text-txt">{t("aboutVersionTitle")}</h2>
            <p className="mt-1.5 text-sm text-txt-secondary">{version}</p>
          </section>
        )}

        <section>
          <h2 className="text-base font-semibold text-txt">{t("aboutOperatorTitle")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-txt-secondary">{t("aboutOperatorBody")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-txt">{t("aboutLegalTitle")}</h2>
          <div className="space-y-2">
            <Link href="/terms-of-service" className="block">
              <Card className="flex items-center gap-3 p-4">
                <Icons.fileText className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
                <span className="flex-1 font-medium text-txt">{t("termsOfService")}</span>
                <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
              </Card>
            </Link>
            <Link href="/privacy-policy" className="block">
              <Card className="flex items-center gap-3 p-4">
                <Icons.shield className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
                <span className="flex-1 font-medium text-txt">{t("privacyPolicy")}</span>
                <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/app/'(app)'/profile/about/__tests__/page.test.tsx`

Expected: PASS with `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add src/app/'(app)'/profile/about/page.tsx src/messages/en.json src/messages/tr.json src/lib/app-info.ts src/app/'(app)'/profile/about/__tests__/page.test.tsx
git commit -m "feat: add about profile page"
```

## Task 4: Add the Support Page Test Harness

**Files:**
- Create: `src/app/(app)/profile/support/__tests__/page.test.tsx`
- Create: `src/app/(app)/profile/support/page.tsx`
- Test: `src/app/(app)/profile/support/__tests__/page.test.tsx`

- [ ] **Step 1: Write the failing support page tests**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import SupportPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

describe("SupportPage", () => {
  it("shows direct support actions and legal shortcuts", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SupportPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("2gurmepati@gmail.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /email support/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /terms of service/i })).toHaveAttribute(
      "href",
      "/terms-of-service",
    );
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/privacy-policy",
    );
  });

  it("requires subject and message before launching a support draft", async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SupportPage />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /send support request/i }));

    expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
    expect(screen.getByText(/message is required/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/'(app)'/profile/support/__tests__/page.test.tsx`

Expected: FAIL because the support page does not exist.

- [ ] **Step 3: Create a minimal support page shell so the test can narrow**

```tsx
"use client";

export default function SupportPage() {
  return null;
}
```

- [ ] **Step 4: Run test to verify it still fails on missing content rather than import errors**

Run: `npm test -- src/app/'(app)'/profile/support/__tests__/page.test.tsx`

Expected: FAIL with missing text/button assertions.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(app)'/profile/support/page.tsx src/app/'(app)'/profile/support/__tests__/page.test.tsx
git commit -m "test: scaffold support page coverage"
```

## Task 5: Implement Support Page Rendering and Validation

**Files:**
- Modify: `src/app/(app)/profile/support/page.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`
- Test: `src/app/(app)/profile/support/__tests__/page.test.tsx`

- [ ] **Step 1: Extend the support tests to assert `mailto:` payload generation**

```tsx
it("builds a prefilled support mailto link with subject, version, and locale", async () => {
  const assignSpy = vi
    .spyOn(window.location, "assign")
    .mockImplementation(() => undefined);
  const user = userEvent.setup();

  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SupportPage />
    </NextIntlClientProvider>,
  );

  await user.type(screen.getByLabelText(/subject/i), "Billing issue");
  await user.type(screen.getByLabelText(/message/i), "The app store purchase did not unlock.");
  await user.click(screen.getByRole("button", { name: /send support request/i }));

  expect(assignSpy).toHaveBeenCalledWith(
    expect.stringContaining("mailto:2gurmepati@gmail.com?subject=PawBalance%20Support%3A%20Billing%20issue"),
  );
  expect(assignSpy.mock.calls[0][0]).toContain(encodeURIComponent("Locale: en"));
  expect(assignSpy.mock.calls[0][0]).toContain(encodeURIComponent("Version: 1.0.0"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/'(app)'/profile/support/__tests__/page.test.tsx`

Expected: FAIL because no form logic or `mailto:` generation exists yet.

- [ ] **Step 3: Add localized support copy**

```json
{
  "supportTitle": "Need help?",
  "supportEmailLabel": "Support email",
  "supportEmailAction": "Email Support",
  "supportShortcutsTitle": "Help shortcuts",
  "supportRequestTitle": "Support request",
  "supportRequestSubject": "Subject",
  "supportRequestMessage": "Message",
  "supportRequestSubjectRequired": "Subject is required.",
  "supportRequestMessageRequired": "Message is required.",
  "supportRequestSubmit": "Send Support Request",
  "supportMailFallback": "If your mail app does not open, email us directly at 2gurmepati@gmail.com."
}
```

- [ ] **Step 4: Implement support page UI and `mailto:` generation**

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icon";
import { getAppVersionLabel } from "@/lib/app-info";

function buildSupportMailto(subject: string, message: string, locale: string) {
  const body = [
    message,
    "",
    `Locale: ${locale}`,
    `Version: ${getAppVersionLabel() || "unknown"}`,
  ].join("\n");

  const params = new URLSearchParams({
    subject: `PawBalance Support: ${subject}`,
    body,
  });

  return `mailto:2gurmepati@gmail.com?${params.toString()}`;
}

export default function SupportPage() {
  const t = useTranslations();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({});
  const [showFallback, setShowFallback] = useState(false);
  const locale = "en";

  const openMailto = (href: string) => {
    try {
      window.location.assign(href);
    } catch {
      setShowFallback(true);
    }
  };

  const submit = () => {
    const nextErrors: { subject?: string; message?: string } = {};
    if (!subject.trim()) nextErrors.subject = t("supportRequestSubjectRequired");
    if (!message.trim()) nextErrors.message = t("supportRequestMessageRequired");
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    openMailto(buildSupportMailto(subject.trim(), message.trim(), locale));
  };

  return (
    <div className="safe-top mx-auto min-h-screen max-w-md bg-canvas">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur-sm">
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:bg-border/50" aria-label={t("back")}>
          <Icons.arrowLeft className="h-5 w-5 text-txt" />
        </button>
        <h1 className="text-lg font-bold text-txt">{t("helpAndSupport")}</h1>
      </div>

      <div className="space-y-6 px-4 py-6">
        <section>
          <h2 className="mb-2 text-base font-semibold text-txt">{t("supportTitle")}</h2>
          <Card className="space-y-3 p-4">
            <p className="text-sm text-txt-secondary">{t("supportEmailLabel")}</p>
            <p className="font-medium text-txt">2gurmepati@gmail.com</p>
            <button
              type="button"
              onClick={() => openMailto("mailto:2gurmepati@gmail.com")}
              className="w-full rounded-button bg-primary-btn py-3 text-sm font-medium text-white"
            >
              {t("supportEmailAction")}
            </button>
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-txt">{t("supportRequestTitle")}</h2>
          <Card className="space-y-4 p-4">
            <label className="block text-sm font-medium text-txt">
              {t("supportRequestSubject")}
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm text-txt"
              />
              {errors.subject && <span className="mt-1 block text-sm text-error">{errors.subject}</span>}
            </label>
            <label className="block text-sm font-medium text-txt">
              {t("supportRequestMessage")}
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-1 min-h-32 w-full rounded-xl border border-border px-3 py-2 text-sm text-txt"
              />
              {errors.message && <span className="mt-1 block text-sm text-error">{errors.message}</span>}
            </label>
            <button
              type="button"
              onClick={submit}
              className="w-full rounded-button bg-primary-btn py-3 text-sm font-medium text-white"
            >
              {t("supportRequestSubmit")}
            </button>
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-txt">{t("supportShortcutsTitle")}</h2>
          <div className="space-y-2">
            <Link href="/terms-of-service" className="block">
              <Card className="flex items-center gap-3 p-4">
                <Icons.fileText className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
                <span className="flex-1 font-medium text-txt">{t("termsOfService")}</span>
                <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
              </Card>
            </Link>
            <Link href="/privacy-policy" className="block">
              <Card className="flex items-center gap-3 p-4">
                <Icons.shield className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
                <span className="flex-1 font-medium text-txt">{t("privacyPolicy")}</span>
                <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
              </Card>
            </Link>
          </div>
        </section>

        {showFallback && (
          <p className="text-sm text-txt-secondary">{t("supportMailFallback")}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/app/'(app)'/profile/support/__tests__/page.test.tsx`

Expected: PASS with all support page assertions green.

- [ ] **Step 6: Commit**

```bash
git add src/app/'(app)'/profile/support/page.tsx src/app/'(app)'/profile/support/__tests__/page.test.tsx src/messages/en.json src/messages/tr.json
git commit -m "feat: add support profile page"
```

## Task 6: Fix Locale-Aware Mail Drafting and Fallback Edge Cases

**Files:**
- Modify: `src/app/(app)/profile/support/page.tsx`
- Test: `src/app/(app)/profile/support/__tests__/page.test.tsx`

- [ ] **Step 1: Add a failing test for locale-aware payload and fallback visibility**

```tsx
it("shows fallback copy when mail launch throws", async () => {
  const assignSpy = vi
    .spyOn(window.location, "assign")
    .mockImplementation(() => {
      throw new Error("blocked");
    });
  const user = userEvent.setup();

  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SupportPage />
    </NextIntlClientProvider>,
  );

  await user.click(screen.getByRole("button", { name: /email support/i }));

  expect(assignSpy).toHaveBeenCalled();
  expect(screen.getByText(/email us directly at 2gurmepati@gmail.com/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/'(app)'/profile/support/__tests__/page.test.tsx`

Expected: FAIL if fallback state is not rendered for the direct CTA path or locale is hardcoded.

- [ ] **Step 3: Replace hardcoded locale with real locale hook and reuse open handler**

```tsx
import { useLocale } from "@/hooks/use-locale";

const { locale } = useLocale();

const emailHref = buildSupportMailto(subject.trim(), message.trim(), locale);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/'(app)'/profile/support/__tests__/page.test.tsx`

Expected: PASS with fallback coverage still green.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(app)'/profile/support/page.tsx src/app/'(app)'/profile/support/__tests__/page.test.tsx
git commit -m "fix: make support draft locale aware"
```

## Task 7: Verify Full Feature and Refresh Graph

**Files:**
- Modify: `graphify-out/` via rebuild command
- Test: profile/about/support test files plus locale-backed rendering

- [ ] **Step 1: Run focused automated tests**

Run:

```bash
npm test -- \
  src/app/'(app)'/profile/__tests__/profile-page.test.tsx \
  src/app/'(app)'/profile/about/__tests__/page.test.tsx \
  src/app/'(app)'/profile/support/__tests__/page.test.tsx
```

Expected: PASS with all three test files green.

- [ ] **Step 2: Run a broader regression pass**

Run: `npm test`

Expected: PASS for the full Vitest suite.

- [ ] **Step 3: Refresh the graphify knowledge graph**

Run:

```bash
python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

Expected: command exits successfully and updates `graphify-out/` artifacts.

- [ ] **Step 4: Inspect final worktree state**

Run: `git status --short`

Expected: only intended code, locale, test, and graph files remain modified.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(app)'/profile src/lib/app-info.ts src/messages/en.json src/messages/tr.json graphify-out
git commit -m "feat: add support and about profile pages"
```

## Self-Review

### Spec coverage

- Dedicated `Help & Support` page: covered by Tasks 4, 5, and 6.
- Dedicated `About` page: covered by Tasks 2 and 3.
- Mail app launch to `2gurmepati@gmail.com`: covered by Tasks 5 and 6.
- Support request form opening prefilled draft: covered by Task 5.
- Help/legal shortcuts: covered by Tasks 3 and 5.
- App summary, mission, version, founder/operator details: covered by Task 3.
- Remove top-right settings button: covered by Task 1.
- Locale coverage and validation copy: covered by Tasks 3, 5, and 7.
- Graph rebuild requirement from `AGENTS.md`: covered by Task 7.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain.
- Each code-changing step includes concrete code.
- Each verification step includes an exact command and expected outcome.

### Type consistency

- Shared version API stays `getAppVersionLabel()`.
- Support payload builder stays `buildSupportMailto(subject, message, locale)`.
- Routes stay `/profile/support` and `/profile/about`.

