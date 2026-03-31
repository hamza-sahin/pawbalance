# Terms & Privacy Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Terms of Service, Privacy Policy pages, and a blocking acceptance gate to comply with Apple App Store Guidelines 5.1.1.

**Architecture:** Three new standalone routes (`/terms`, `/terms-of-service`, `/privacy-policy`). A gate check in the app layout redirects users who haven't accepted the current terms version. Acceptance stored in Supabase `user_metadata` for authenticated users and `localStorage` for iOS guests, with sync on login.

**Tech Stack:** Next.js 15 (App Router, static export), Tailwind CSS 4, next-intl (EN + TR), Zustand, Supabase Auth, Capacitor (isNative detection)

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/constants.ts` | Add `CURRENT_TERMS_VERSION` constant |
| `src/lib/terms.ts` | New — terms gate logic: `shouldRequireTerms()`, `acceptTerms()`, `getAcceptedTermsVersion()` |
| `src/app/terms/page.tsx` | New — acceptance gate page with checkbox + continue button |
| `src/app/terms-of-service/page.tsx` | New — full Terms of Service document page |
| `src/app/privacy-policy/page.tsx` | New — full Privacy Policy document page |
| `src/app/(app)/layout.tsx` | Modify — add terms gate check before onboarding gate |
| `src/hooks/use-auth.ts` | Modify — sync guest terms acceptance on login/signup |
| `src/messages/en.json` | Modify — add all terms/privacy i18n keys |
| `src/messages/tr.json` | Modify — add all terms/privacy i18n keys (Turkish) |

---

### Task 1: Add CURRENT_TERMS_VERSION constant and terms utility module

**Files:**
- Modify: `src/lib/constants.ts`
- Create: `src/lib/terms.ts`

- [ ] **Step 1: Add the version constant to constants.ts**

Add at the end of `src/lib/constants.ts`, after the existing `SEARCH_DEBOUNCE_MS` line:

```typescript
// ============================================================
// Terms & Privacy
// ============================================================

export const CURRENT_TERMS_VERSION = 1;
```

- [ ] **Step 2: Create the terms utility module**

Create `src/lib/terms.ts`:

```typescript
import { getSupabase } from "@/lib/supabase";
import { isNative } from "@/lib/platform";
import { CURRENT_TERMS_VERSION } from "@/lib/constants";

const TERMS_LS_KEY = "accepted_terms_version";

/**
 * Read the terms version the user has accepted.
 * Authenticated: from Supabase user_metadata.
 * Guest: from localStorage (iOS only).
 */
export function getAcceptedTermsVersion(
  userMetadata: Record<string, unknown> | undefined,
): number {
  // Authenticated user — check metadata
  if (userMetadata) {
    const v = userMetadata.accepted_terms_version;
    return typeof v === "number" ? v : 0;
  }
  // Guest — check localStorage
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(TERMS_LS_KEY);
  return stored ? parseInt(stored, 10) || 0 : 0;
}

/**
 * Determine whether the terms gate should block navigation.
 * iOS (native): always check, guest or authenticated.
 * Web: only check when authenticated.
 */
export function shouldRequireTerms(
  isAuthenticated: boolean,
  userMetadata: Record<string, unknown> | undefined,
): boolean {
  if (isNative) {
    return getAcceptedTermsVersion(isAuthenticated ? userMetadata : undefined) < CURRENT_TERMS_VERSION;
  }
  // Web: only gate authenticated users
  if (!isAuthenticated) return false;
  return getAcceptedTermsVersion(userMetadata) < CURRENT_TERMS_VERSION;
}

/**
 * Persist terms acceptance.
 * Authenticated: writes to Supabase user_metadata.
 * Guest: writes to localStorage.
 */
export async function acceptTerms(isAuthenticated: boolean): Promise<void> {
  if (isAuthenticated) {
    const supabase = getSupabase();
    const { error } = await supabase.auth.updateUser({
      data: { accepted_terms_version: CURRENT_TERMS_VERSION },
    });
    if (error) throw error;
  } else {
    localStorage.setItem(TERMS_LS_KEY, String(CURRENT_TERMS_VERSION));
  }
}

/**
 * Sync guest terms acceptance to Supabase after login/signup.
 * Call this alongside guest pet sync.
 */
export async function syncGuestTermsAcceptance(): Promise<void> {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(TERMS_LS_KEY);
  if (!stored) return;

  const version = parseInt(stored, 10) || 0;
  if (version < 1) return;

  const supabase = getSupabase();
  await supabase.auth.updateUser({
    data: { accepted_terms_version: version },
  });
  localStorage.removeItem(TERMS_LS_KEY);
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `npx next build 2>&1 | tail -5`
Expected: Build completes without errors (new module is not yet imported anywhere, so no impact).

- [ ] **Step 4: Commit**

```bash
git add src/lib/constants.ts src/lib/terms.ts
git commit -m "feat: add terms version constant and terms utility module"
```

---

### Task 2: Add i18n keys for terms and legal pages

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Add English i18n keys**

Add these keys to `src/messages/en.json` before the closing `}`. Insert after the `"updateNow": "Update"` line (add a comma after `"Update"`):

```json
  "termsTitle": "Terms & Conditions",
  "termsUpdatedTitle": "We've Updated Our Terms",
  "termsSubtitle": "Please review and accept our terms to continue using PawBalance.",
  "termsOfService": "Terms of Service",
  "privacyPolicy": "Privacy Policy",
  "termsCheckbox": "I have read and agree to the Terms of Service and Privacy Policy",
  "termsContinue": "Continue",
  "termsLastUpdated": "Last updated: {date}",
  "tosIntro": "Welcome to PawBalance. By using our application, you agree to the following terms.",
  "tosOperator": "PawBalance is operated by Hamza Sahin, located at Rotermanni 7, Tallinn 10111, Estonia. For questions, contact hamiissah@gmail.com.",
  "tosServiceTitle": "1. Service Description",
  "tosServiceBody": "PawBalance is a pet nutrition reference application that provides general information about food safety for dogs. The information provided is for educational purposes only and does not constitute veterinary advice. Always consult a qualified veterinarian before making dietary changes for your pet.",
  "tosEligibilityTitle": "2. Eligibility",
  "tosEligibilityBody": "You must be at least 13 years of age to use PawBalance. If you are under 18, you must have parental or guardian consent to use the service.",
  "tosAccountsTitle": "3. User Accounts",
  "tosAccountsBody": "You are responsible for maintaining the confidentiality of your account credentials. Each person may maintain only one account. You agree to provide accurate information when creating your account.",
  "tosAcceptableUseTitle": "4. Acceptable Use",
  "tosAcceptableUseBody": "You agree not to: scrape, crawl, or automatically extract data from PawBalance; use the service for commercial purposes without permission; attempt to interfere with or disrupt the service; redistribute food safety data from PawBalance.",
  "tosIpTitle": "5. Intellectual Property",
  "tosIpBody": "All content within PawBalance, including the food safety database, user interface, and design, is owned by the operator and protected by applicable intellectual property laws. You may not copy, modify, or distribute this content without permission.",
  "tosDisclaimerTitle": "6. Disclaimer",
  "tosDisclaimerBody": "Food safety information in PawBalance is provided for general guidance only. Individual dogs may have specific allergies, sensitivities, or health conditions that affect their dietary needs. We do not guarantee the accuracy, completeness, or suitability of any information provided. Always consult your veterinarian for medical decisions regarding your pet.",
  "tosLiabilityTitle": "7. Limitation of Liability",
  "tosLiabilityBody": "To the maximum extent permitted by law, the operator shall not be liable for any damages arising from your use of PawBalance, including but not limited to any adverse health outcomes for your pet based on information provided in the application.",
  "tosTerminationTitle": "8. Termination",
  "tosTerminationBody": "We may suspend or terminate your access to PawBalance at any time if you violate these terms. You may stop using the service at any time by deleting your account.",
  "tosGoverningLawTitle": "9. Governing Law",
  "tosGoverningLawBody": "These terms are governed by the laws of the Republic of Estonia. Any disputes shall be resolved in the courts of Estonia.",
  "tosChangesTitle": "10. Changes to Terms",
  "tosChangesBody": "We may update these terms from time to time. When we do, you will be asked to review and accept the updated terms before continuing to use PawBalance.",
  "ppIntro": "This Privacy Policy explains how PawBalance collects, uses, and protects your personal information.",
  "ppOperator": "PawBalance is operated by Hamza Sahin, located at Rotermanni 7, Tallinn 10111, Estonia. For privacy inquiries, contact hamiissah@gmail.com.",
  "ppDataCollectedTitle": "1. Information We Collect",
  "ppDataCollectedBody": "We collect the following information when you use PawBalance:",
  "ppDataAccount": "Account information: email address, display name, and profile picture (provided via email signup, Google, or Apple Sign-In)",
  "ppDataPet": "Pet information: name, breed, weight, age, gender, neutered status, body condition score, activity level, and photos",
  "ppDataFood": "Food requests: the name of foods you request to be added to our database",
  "ppDataPreferences": "Preferences: your language setting (English or Turkish)",
  "ppDataDevice": "Device information: app version and device identifier (collected automatically on iOS for delivering app updates)",
  "ppHowUsedTitle": "2. How We Use Your Information",
  "ppHowUsedBody": "We use your information to: provide and maintain your account; display personalized pet nutrition information; improve our food safety database based on user requests; deliver app updates on iOS devices.",
  "ppThirdPartyTitle": "3. Third-Party Services",
  "ppThirdPartyBody": "PawBalance uses the following third-party services to operate:",
  "ppThirdPartySupabase": "Supabase: hosts our database, authentication system, and file storage. All account and pet data is stored on Supabase servers.",
  "ppThirdPartyGoogle": "Google OAuth: if you sign in with Google, your email, name, and profile picture are shared with Google for authentication.",
  "ppThirdPartyApple": "Apple Sign-In: if you sign in with Apple (iOS only), your email and name are shared with Apple for authentication.",
  "ppThirdPartyCapgo": "Capgo: delivers over-the-air app updates on iOS. Collects your device identifier and app version.",
  "ppStorageTitle": "4. Data Storage",
  "ppStorageBody": "Your data is stored on Supabase servers. Pet photos are stored in Supabase Storage and are accessible via public URLs. We use a cookie to store your language preference (expires after 1 year). Supabase automatically manages session cookies for authentication.",
  "ppNoTrackingTitle": "5. Analytics and Tracking",
  "ppNoTrackingBody": "PawBalance does not use any behavioral analytics, advertising trackers, or third-party tracking services. We do not track your browsing behavior or sell your data to third parties.",
  "ppRetentionTitle": "6. Data Retention",
  "ppRetentionBody": "Your data is retained for as long as your account exists. You can delete individual pet records at any time from within the app. To request complete account deletion, contact us at hamiissah@gmail.com.",
  "ppRightsTitle": "7. Your Rights (GDPR)",
  "ppRightsBody": "Under the General Data Protection Regulation (GDPR), you have the right to: access your personal data; correct inaccurate data; request deletion of your data; request a copy of your data in a portable format; withdraw consent at any time. To exercise these rights, contact hamiissah@gmail.com.",
  "ppChildrenTitle": "8. Children's Privacy",
  "ppChildrenBody": "PawBalance is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can delete it.",
  "ppChangesTitle": "9. Changes to This Policy",
  "ppChangesBody": "We may update this Privacy Policy from time to time. When we do, you will be asked to review and accept the updated policy before continuing to use PawBalance."
```

- [ ] **Step 2: Add Turkish i18n keys**

Add these keys to `src/messages/tr.json` before the closing `}`. Insert after the `"updateNow": "Güncelle"` line (add a comma after `"Güncelle"`):

```json
  "termsTitle": "Kullanım Koşulları",
  "termsUpdatedTitle": "Koşullarımızı Güncelledik",
  "termsSubtitle": "PawBalance'ı kullanmaya devam etmek için lütfen koşullarımızı inceleyin ve kabul edin.",
  "termsOfService": "Hizmet Koşulları",
  "privacyPolicy": "Gizlilik Politikası",
  "termsCheckbox": "Hizmet Koşulları'nı ve Gizlilik Politikası'nı okudum ve kabul ediyorum",
  "termsContinue": "Devam Et",
  "termsLastUpdated": "Son güncelleme: {date}",
  "tosIntro": "PawBalance'a hoş geldiniz. Uygulamamızı kullanarak aşağıdaki koşulları kabul etmiş olursunuz.",
  "tosOperator": "PawBalance, Rotermanni 7, Tallinn 10111, Estonya adresinde bulunan Hamza Sahin tarafından işletilmektedir. Sorularınız için hamiissah@gmail.com adresine başvurabilirsiniz.",
  "tosServiceTitle": "1. Hizmet Tanımı",
  "tosServiceBody": "PawBalance, köpekler için yiyecek güvenliği hakkında genel bilgi sağlayan bir evcil hayvan beslenme referans uygulamasıdır. Sağlanan bilgiler yalnızca eğitim amaçlıdır ve veteriner tavsiyesi niteliği taşımaz. Evcil hayvanınızın diyetinde değişiklik yapmadan önce her zaman nitelikli bir veterinere danışın.",
  "tosEligibilityTitle": "2. Uygunluk",
  "tosEligibilityBody": "PawBalance'ı kullanmak için en az 13 yaşında olmalısınız. 18 yaşından küçükseniz, hizmeti kullanmak için ebeveyn veya vasi onayına sahip olmalısınız.",
  "tosAccountsTitle": "3. Kullanıcı Hesapları",
  "tosAccountsBody": "Hesap bilgilerinizin gizliliğini korumaktan siz sorumlusunuz. Her kişi yalnızca bir hesap tutabilir. Hesabınızı oluştururken doğru bilgi sağlamayı kabul edersiniz.",
  "tosAcceptableUseTitle": "4. Kabul Edilebilir Kullanım",
  "tosAcceptableUseBody": "Şunları yapmamayı kabul edersiniz: PawBalance'tan veri kazımak, taramak veya otomatik olarak çıkarmak; hizmeti izinsiz ticari amaçlarla kullanmak; hizmeti engellemeye veya bozmaya çalışmak; PawBalance'taki yiyecek güvenliği verilerini yeniden dağıtmak.",
  "tosIpTitle": "5. Fikri Mülkiyet",
  "tosIpBody": "Yiyecek güvenliği veritabanı, kullanıcı arayüzü ve tasarım dahil olmak üzere PawBalance içindeki tüm içerik işletmeciye aittir ve geçerli fikri mülkiyet yasaları ile korunmaktadır. Bu içeriği izinsiz kopyalayamaz, değiştiremez veya dağıtamazsınız.",
  "tosDisclaimerTitle": "6. Sorumluluk Reddi",
  "tosDisclaimerBody": "PawBalance'taki yiyecek güvenliği bilgileri yalnızca genel rehberlik amacıyla sağlanmaktadır. Her köpeğin diyet ihtiyaçlarını etkileyen özel alerjileri, hassasiyetleri veya sağlık durumları olabilir. Sağlanan bilgilerin doğruluğunu, eksiksizliğini veya uygunluğunu garanti etmiyoruz. Evcil hayvanınızla ilgili tıbbi kararlar için her zaman veterinerinize danışın.",
  "tosLiabilityTitle": "7. Sorumluluk Sınırlaması",
  "tosLiabilityBody": "Yasaların izin verdiği azami ölçüde, işletmeci, uygulamada sağlanan bilgilere dayanan evcil hayvan sağlığı sonuçları dahil ancak bunlarla sınırlı olmamak üzere, PawBalance kullanımınızdan kaynaklanan herhangi bir zarardan sorumlu olmayacaktır.",
  "tosTerminationTitle": "8. Fesih",
  "tosTerminationBody": "Bu koşulları ihlal etmeniz durumunda PawBalance'a erişiminizi istediğimiz zaman askıya alabilir veya sonlandırabiliriz. Hesabınızı silerek hizmeti istediğiniz zaman kullanmayı bırakabilirsiniz.",
  "tosGoverningLawTitle": "9. Geçerli Hukuk",
  "tosGoverningLawBody": "Bu koşullar Estonya Cumhuriyeti yasalarına tabidir. Herhangi bir anlaşmazlık Estonya mahkemelerinde çözülecektir.",
  "tosChangesTitle": "10. Koşullarda Değişiklikler",
  "tosChangesBody": "Bu koşulları zaman zaman güncelleyebiliriz. Güncelleme yaptığımızda, PawBalance'ı kullanmaya devam etmeden önce güncellenmiş koşulları incelemeniz ve kabul etmeniz istenecektir.",
  "ppIntro": "Bu Gizlilik Politikası, PawBalance'ın kişisel bilgilerinizi nasıl topladığını, kullandığını ve koruduğunu açıklar.",
  "ppOperator": "PawBalance, Rotermanni 7, Tallinn 10111, Estonya adresinde bulunan Hamza Sahin tarafından işletilmektedir. Gizlilik sorularınız için hamiissah@gmail.com adresine başvurabilirsiniz.",
  "ppDataCollectedTitle": "1. Topladığımız Bilgiler",
  "ppDataCollectedBody": "PawBalance'ı kullandığınızda aşağıdaki bilgileri topluyoruz:",
  "ppDataAccount": "Hesap bilgileri: e-posta adresi, görünen ad ve profil fotoğrafı (e-posta kaydı, Google veya Apple Girişi ile sağlanır)",
  "ppDataPet": "Evcil hayvan bilgileri: isim, ırk, kilo, yaş, cinsiyet, kısırlaştırma durumu, vücut kondisyon skoru, aktivite seviyesi ve fotoğraflar",
  "ppDataFood": "Yiyecek talepleri: veritabanımıza eklenmesini istediğiniz yiyeceklerin adları",
  "ppDataPreferences": "Tercihler: dil ayarınız (İngilizce veya Türkçe)",
  "ppDataDevice": "Cihaz bilgileri: uygulama sürümü ve cihaz tanımlayıcısı (uygulama güncellemelerini sunmak için iOS'ta otomatik olarak toplanır)",
  "ppHowUsedTitle": "2. Bilgilerinizi Nasıl Kullanıyoruz",
  "ppHowUsedBody": "Bilgilerinizi şu amaçlarla kullanıyoruz: hesabınızı sağlamak ve sürdürmek; kişiselleştirilmiş evcil hayvan beslenme bilgilerini göstermek; kullanıcı taleplerinden yola çıkarak yiyecek güvenliği veritabanımızı geliştirmek; iOS cihazlarda uygulama güncellemelerini sunmak.",
  "ppThirdPartyTitle": "3. Üçüncü Taraf Hizmetleri",
  "ppThirdPartyBody": "PawBalance çalışmak için aşağıdaki üçüncü taraf hizmetlerini kullanır:",
  "ppThirdPartySupabase": "Supabase: veritabanımızı, kimlik doğrulama sistemimizi ve dosya depolamamızı barındırır. Tüm hesap ve evcil hayvan verileri Supabase sunucularında saklanır.",
  "ppThirdPartyGoogle": "Google OAuth: Google ile giriş yaparsanız, kimlik doğrulama için e-postanız, adınız ve profil fotoğrafınız Google ile paylaşılır.",
  "ppThirdPartyApple": "Apple Girişi: Apple ile giriş yaparsanız (yalnızca iOS), kimlik doğrulama için e-postanız ve adınız Apple ile paylaşılır.",
  "ppThirdPartyCapgo": "Capgo: iOS'ta kablosuz uygulama güncellemelerini sunar. Cihaz tanımlayıcınızı ve uygulama sürümünüzü toplar.",
  "ppStorageTitle": "4. Veri Depolama",
  "ppStorageBody": "Verileriniz Supabase sunucularında saklanır. Evcil hayvan fotoğrafları Supabase Storage'da saklanır ve herkese açık URL'ler aracılığıyla erişilebilir. Dil tercihinizi saklamak için bir çerez kullanıyoruz (1 yıl sonra sona erer). Supabase, kimlik doğrulama için oturum çerezlerini otomatik olarak yönetir.",
  "ppNoTrackingTitle": "5. Analiz ve Takip",
  "ppNoTrackingBody": "PawBalance herhangi bir davranışsal analiz, reklam takibi veya üçüncü taraf izleme hizmeti kullanmaz. Gezinme davranışınızı izlemiyoruz veya verilerinizi üçüncü taraflara satmıyoruz.",
  "ppRetentionTitle": "6. Veri Saklama",
  "ppRetentionBody": "Verileriniz hesabınız var olduğu sürece saklanır. Uygulama içinden istediğiniz zaman evcil hayvan kayıtlarını silebilirsiniz. Hesabınızın tamamen silinmesini talep etmek için hamiissah@gmail.com adresine başvurun.",
  "ppRightsTitle": "7. Haklarınız (GDPR)",
  "ppRightsBody": "Genel Veri Koruma Yönetmeliği (GDPR) kapsamında şu haklara sahipsiniz: kişisel verilerinize erişim; hatalı verilerin düzeltilmesi; verilerinizin silinmesini talep etme; verilerinizin taşınabilir bir formatta kopyasını talep etme; onayınızı istediğiniz zaman geri çekme. Bu haklarınızı kullanmak için hamiissah@gmail.com adresine başvurun.",
  "ppChildrenTitle": "8. Çocukların Gizliliği",
  "ppChildrenBody": "PawBalance 13 yaşın altındaki çocuklara yönelik değildir. 13 yaşın altındaki çocuklardan bilerek kişisel bilgi toplamıyoruz. Bir çocuğun bize kişisel bilgi sağladığına inanıyorsanız, silmemiz için lütfen bizimle iletişime geçin.",
  "ppChangesTitle": "9. Bu Politikadaki Değişiklikler",
  "ppChangesBody": "Bu Gizlilik Politikası'nı zaman zaman güncelleyebiliriz. Güncelleme yaptığımızda, PawBalance'ı kullanmaya devam etmeden önce güncellenmiş politikayı incelemeniz ve kabul etmeniz istenecektir."
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/messages/en.json','utf8')); console.log('en.json OK')" && node -e "JSON.parse(require('fs').readFileSync('src/messages/tr.json','utf8')); console.log('tr.json OK')"`

Expected: `en.json OK` and `tr.json OK`

- [ ] **Step 4: Commit**

```bash
git add src/messages/en.json src/messages/tr.json
git commit -m "feat: add i18n keys for terms, privacy policy, and acceptance gate (EN + TR)"
```

---

### Task 3: Create Terms of Service page

**Files:**
- Create: `src/app/terms-of-service/page.tsx`

- [ ] **Step 1: Create the Terms of Service page**

Create `src/app/terms-of-service/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/icon";

export default function TermsOfServicePage() {
  const t = useTranslations();
  const router = useRouter();

  const sections = [
    { title: t("tosServiceTitle"), body: t("tosServiceBody") },
    { title: t("tosEligibilityTitle"), body: t("tosEligibilityBody") },
    { title: t("tosAccountsTitle"), body: t("tosAccountsBody") },
    { title: t("tosAcceptableUseTitle"), body: t("tosAcceptableUseBody") },
    { title: t("tosIpTitle"), body: t("tosIpBody") },
    { title: t("tosDisclaimerTitle"), body: t("tosDisclaimerBody") },
    { title: t("tosLiabilityTitle"), body: t("tosLiabilityBody") },
    { title: t("tosTerminationTitle"), body: t("tosTerminationBody") },
    { title: t("tosGoverningLawTitle"), body: t("tosGoverningLawBody") },
    { title: t("tosChangesTitle"), body: t("tosChangesBody") },
  ];

  return (
    <div className="safe-top mx-auto min-h-screen max-w-md bg-canvas">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:bg-border/50"
          aria-label={t("back")}
        >
          <Icons.arrowLeft className="h-5 w-5 text-txt" />
        </button>
        <h1 className="text-lg font-bold text-txt">{t("termsOfService")}</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        <p className="text-sm text-txt-secondary">{t("tosIntro")}</p>
        <p className="text-sm text-txt-secondary">{t("tosOperator")}</p>

        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-base font-semibold text-txt">{section.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-txt-secondary">
              {section.body}
            </p>
          </div>
        ))}

        <p className="text-xs text-txt-tertiary">
          {t("termsLastUpdated", { date: "March 31, 2026" })}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/terms-of-service/page.tsx
git commit -m "feat: add Terms of Service page"
```

---

### Task 4: Create Privacy Policy page

**Files:**
- Create: `src/app/privacy-policy/page.tsx`

- [ ] **Step 1: Create the Privacy Policy page**

Create `src/app/privacy-policy/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/icon";

export default function PrivacyPolicyPage() {
  const t = useTranslations();
  const router = useRouter();

  const dataItems = [
    t("ppDataAccount"),
    t("ppDataPet"),
    t("ppDataFood"),
    t("ppDataPreferences"),
    t("ppDataDevice"),
  ];

  const thirdPartyItems = [
    t("ppThirdPartySupabase"),
    t("ppThirdPartyGoogle"),
    t("ppThirdPartyApple"),
    t("ppThirdPartyCapgo"),
  ];

  const sections = [
    { title: t("ppHowUsedTitle"), body: t("ppHowUsedBody") },
    { title: t("ppStorageTitle"), body: t("ppStorageBody") },
    { title: t("ppNoTrackingTitle"), body: t("ppNoTrackingBody") },
    { title: t("ppRetentionTitle"), body: t("ppRetentionBody") },
    { title: t("ppRightsTitle"), body: t("ppRightsBody") },
    { title: t("ppChildrenTitle"), body: t("ppChildrenBody") },
    { title: t("ppChangesTitle"), body: t("ppChangesBody") },
  ];

  return (
    <div className="safe-top mx-auto min-h-screen max-w-md bg-canvas">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:bg-border/50"
          aria-label={t("back")}
        >
          <Icons.arrowLeft className="h-5 w-5 text-txt" />
        </button>
        <h1 className="text-lg font-bold text-txt">{t("privacyPolicy")}</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        <p className="text-sm text-txt-secondary">{t("ppIntro")}</p>
        <p className="text-sm text-txt-secondary">{t("ppOperator")}</p>

        {/* Section 1: Data Collected (has bullet list) */}
        <div>
          <h2 className="text-base font-semibold text-txt">{t("ppDataCollectedTitle")}</h2>
          <p className="mt-1.5 text-sm text-txt-secondary">{t("ppDataCollectedBody")}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            {dataItems.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-txt-secondary">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Section 3: Third-Party Services (has bullet list) */}
        <div>
          <h2 className="text-base font-semibold text-txt">{t("ppThirdPartyTitle")}</h2>
          <p className="mt-1.5 text-sm text-txt-secondary">{t("ppThirdPartyBody")}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            {thirdPartyItems.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-txt-secondary">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Remaining sections */}
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-base font-semibold text-txt">{section.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-txt-secondary">
              {section.body}
            </p>
          </div>
        ))}

        <p className="text-xs text-txt-tertiary">
          {t("termsLastUpdated", { date: "March 31, 2026" })}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/privacy-policy/page.tsx
git commit -m "feat: add Privacy Policy page"
```

---

### Task 5: Create Terms Acceptance gate page

**Files:**
- Create: `src/app/terms/page.tsx`

- [ ] **Step 1: Create the terms acceptance page**

Create `src/app/terms/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth-store";
import { acceptTerms, getAcceptedTermsVersion } from "@/lib/terms";
import { CURRENT_TERMS_VERSION } from "@/lib/constants";
import { Icons } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { session, user } = useAuthStore();
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isReConsent =
    getAcceptedTermsVersion(user?.user_metadata) > 0;

  async function handleAccept() {
    setIsLoading(true);
    try {
      await acceptTerms(!!session);
      router.replace("/search");
    } catch {
      // Retry silently — if Supabase is unreachable, the gate will re-show on next load
      setIsLoading(false);
    }
  }

  return (
    <div className="safe-top flex min-h-dvh flex-col items-center justify-between bg-canvas px-6 py-12">
      {/* Top: branding + info */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* App icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-primary shadow-md">
          <Icons.paw className="h-10 w-10 text-white" aria-hidden="true" />
        </div>

        <h1 className="mt-6 text-center text-2xl font-bold text-txt">
          {isReConsent ? t("termsUpdatedTitle") : t("termsTitle")}
        </h1>
        <p className="mt-2 max-w-xs text-center text-sm text-txt-secondary">
          {t("termsSubtitle")}
        </p>

        {/* Document links */}
        <div className="mt-8 w-full max-w-xs space-y-3">
          <button
            onClick={() => router.push("/terms-of-service")}
            className="flex w-full items-center justify-between rounded-card border border-border bg-surface px-4 py-3.5 transition-colors active:bg-border/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icons.fileText className="h-[18px] w-[18px] text-primary-dark" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-txt">{t("termsOfService")}</span>
            </div>
            <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
          </button>

          <button
            onClick={() => router.push("/privacy-policy")}
            className="flex w-full items-center justify-between rounded-card border border-border bg-surface px-4 py-3.5 transition-colors active:bg-border/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icons.shield className="h-[18px] w-[18px] text-primary-dark" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-txt">{t("privacyPolicy")}</span>
            </div>
            <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Bottom: checkbox + continue */}
      <div className="w-full max-w-xs pt-8">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
          <span className="text-sm leading-snug text-txt-secondary">
            {t("termsCheckbox")}
          </span>
        </label>

        <Button
          onClick={handleAccept}
          disabled={!agreed}
          isLoading={isLoading}
          fullWidth
          className="mt-4"
        >
          {t("termsContinue")}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add missing icons to the Icon component**

Check if `fileText`, `shield`, and `chevronRight` exist in `src/components/ui/icon.tsx`. If any are missing, add them. These icons are needed for the document link rows.

Read `src/components/ui/icon.tsx` and add any missing icon imports from `lucide-react`:
- `FileText` as `fileText`
- `Shield` as `shield`
- `ChevronRight` as `chevronRight`

Add to the import statement and the `Icons` object in `src/components/ui/icon.tsx`.

- [ ] **Step 3: Verify the build compiles**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/terms/page.tsx src/components/ui/icon.tsx
git commit -m "feat: add terms acceptance gate page with checkbox and document links"
```

---

### Task 6: Add terms gate to app layout

**Files:**
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Add the terms gate check**

In `src/app/(app)/layout.tsx`, add the import for `shouldRequireTerms` and the redirect logic. The terms check must run **before** the onboarding redirect.

Add to the imports at the top:

```typescript
import { shouldRequireTerms } from "@/lib/terms";
```

Add a new `useEffect` **before** the existing onboarding redirect effect (after the `fetchPets`/`syncGuestPet` effect). Insert between lines 33 and 35 (between the pet-fetch effect and the onboarding effect):

```typescript
  // Redirect to terms acceptance if needed
  useEffect(() => {
    if (authLoading) return;
    if (shouldRequireTerms(!!session, session?.user?.user_metadata)) {
      router.replace("/terms");
    }
  }, [authLoading, session, router]);
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/layout.tsx
git commit -m "feat: add terms acceptance gate to app layout (before onboarding gate)"
```

---

### Task 7: Sync guest terms acceptance on login/signup

**Files:**
- Modify: `src/hooks/use-auth.ts`

- [ ] **Step 1: Add terms sync to the auth listener**

In `src/hooks/use-auth.ts`, import `syncGuestTermsAcceptance` and call it when a user session is established.

Add to the imports at the top of the file:

```typescript
import { syncGuestTermsAcceptance } from "@/lib/terms";
```

In the `useAuthListener` function, inside the `onAuthStateChange` callback, call `syncGuestTermsAcceptance` when a session is established. Modify the callback (around line 23):

Replace:
```typescript
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user ?? null, session);
    });
```

With:
```typescript
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user ?? null, session);
      if (session) {
        syncGuestTermsAcceptance();
      }
    });
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-auth.ts
git commit -m "feat: sync guest terms acceptance to Supabase on login/signup"
```

---

### Task 8: Final build verification and manual test

**Files:** None (verification only)

- [ ] **Step 1: Full static build**

Run: `npm run build`
Expected: Build completes with all pages listed in output, including `/terms`, `/terms-of-service`, `/privacy-policy`.

- [ ] **Step 2: Serve and visually verify**

Run: `npx serve out -p 3456` (in background)

Open `http://localhost:3456/terms` — verify acceptance page renders with logo, heading, document links, checkbox, and disabled button.

Open `http://localhost:3456/terms-of-service` — verify full ToS document renders with all 10 sections and back button.

Open `http://localhost:3456/privacy-policy` — verify full Privacy Policy renders with all 9 sections, bullet lists, and back button.

- [ ] **Step 3: Test gate behavior on web**

1. Open `http://localhost:3456/search` without being logged in → should NOT redirect to `/terms` (web guests are not gated)
2. Log in → should redirect to `/terms` (new authenticated user has no accepted version)
3. Check the checkbox and click Continue → should redirect to `/search`
4. Refresh → should stay on `/search` (acceptance persisted in user_metadata)

- [ ] **Step 4: Commit final state**

If any fixes were needed during verification, commit them:

```bash
git add -A
git commit -m "fix: address issues found during terms/privacy verification"
```

If no fixes were needed, skip this step.

---

## Summary

| Task | Description | Est. |
|---|---|---|
| 1 | Constants + terms utility module | 3 min |
| 2 | i18n keys (EN + TR) | 5 min |
| 3 | Terms of Service page | 3 min |
| 4 | Privacy Policy page | 3 min |
| 5 | Terms acceptance gate page | 5 min |
| 6 | App layout gate integration | 2 min |
| 7 | Guest terms sync on auth | 2 min |
| 8 | Build verification + manual test | 5 min |
