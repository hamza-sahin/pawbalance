export function shouldShowBottomNav(pathname: string | null): boolean {
  if (!pathname) return true;

  // Hide persistent tab nav only on the dedicated full-screen pet edit flow.
  const cleanPath = pathname.split("?")[0].replace(/\/+$/, "");
  return cleanPath !== "/profile/pets/edit" && !cleanPath.startsWith("/profile/pets/edit/");
}
