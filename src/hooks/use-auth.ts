"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { isNative } from "@/lib/platform";

export function useAuthListener() {
  const { setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = getSupabase();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session?.user ?? null, session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user ?? null, session);
    });

    return () => subscription.unsubscribe();
  }, [setAuth, setLoading]);
}

export function useAuth() {
  const { user, session, subscriptionTier, isLoading } = useAuthStore();
  const router = useRouter();

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/search" },
    });
    if (error) throw error;
  }, []);

  const signInWithApple = useCallback(async () => {
    if (isNative) {
      // Capacitor native Apple Sign-In
      const { SignInWithApple: SIWAPlugin } = await import(
        "@capacitor-community/apple-sign-in"
      );
      const nonce = crypto.randomUUID();
      const result = await SIWAPlugin.authorize({
        clientId: "com.petpal.dognutrismart",
        redirectURI: "",
        scopes: "email name",
        nonce,
      });
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: result.response.identityToken,
        nonce,
      });
      if (error) throw error;
    }
    // On web: Apple Sign-In button is not shown, so this is never called.
  }, []);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    useAuthStore.getState().clear();
    router.push("/login");
  }, [router]);

  return {
    user,
    session,
    subscriptionTier,
    isLoading,
    isAuthenticated: !!session,
    displayName:
      user?.user_metadata?.display_name ??
      user?.user_metadata?.name ??
      user?.email ??
      "",
    avatarUrl: user?.user_metadata?.avatar_url ?? null,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    sendPasswordResetEmail,
    signOut,
  };
}
