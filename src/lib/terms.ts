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
