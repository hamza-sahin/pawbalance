export type AppShellMode = "tabbed" | "stacked" | "immersive";

const TAB_ROOTS = new Set(["/profile", "/search", "/recipes", "/learn", "/scan"]);
const IMMERSIVE_ROOTS = new Set([
  "/welcome",
  "/onboarding",
  "/terms",
  "/login",
  "/register",
  "/forgot-password",
]);

function cleanPathname(pathname: string | null): string {
  if (!pathname) return "/search";
  return pathname.split("?")[0].replace(/\/+$/, "") || "/";
}

export function getAppShellMode(pathname: string | null): AppShellMode {
  const cleanPath = cleanPathname(pathname);

  if (cleanPath === "/profile/pets/edit" || cleanPath.startsWith("/profile/pets/edit/")) {
    return "immersive";
  }

  if (IMMERSIVE_ROOTS.has(cleanPath)) {
    return "immersive";
  }

  if (TAB_ROOTS.has(cleanPath)) {
    return "tabbed";
  }

  return "stacked";
}

export function shouldShowBottomNav(pathname: string | null): boolean {
  return getAppShellMode(pathname) === "tabbed";
}
