export function shouldShowBottomNav(pathname: string | null): boolean {
  if (!pathname) return true;

  // Hide persistent tab nav on full-screen pet editing flow.
  return !pathname.startsWith("/profile/pets/edit");
}
