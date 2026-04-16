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
