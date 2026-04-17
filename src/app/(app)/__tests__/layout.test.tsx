import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import AppLayout from "../layout";

let currentPathname = "/search";
const routerReplace = vi.fn();
let termsRequired = false;
const ONBOARDING_KEY = "onboarding_completed";
const GUEST_PET_KEY = "guest_pet";

const authState = {
  session: null as null | { user: { user_metadata?: Record<string, unknown> } },
  subscriptionTier: "FREE" as const,
};

const petStore = {
  pets: [] as Array<unknown>,
  isLoading: false,
  fetchPets: vi.fn(),
  loadGuestPet: vi.fn(),
  syncGuestPet: vi.fn(),
};

const renderLayout = (children: React.ReactNode) => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AppLayout>{children}</AppLayout>
    </NextIntlClientProvider>,
  );
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplace,
    back: vi.fn(),
  }),
  usePathname: () => currentPathname,
}));

vi.mock("@/store/auth-store", () => ({
  useAuthStore: () => ({
    ...authState,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-pets", () => ({
  usePets: () => petStore,
}));

vi.mock("@/hooks/use-purchases", () => ({
  usePurchases: () => ({
    manageSubscription: vi.fn(),
  }),
}));

vi.mock("@/lib/terms", () => ({
  shouldRequireTerms: () => termsRequired,
}));

vi.mock("@/lib/access", async () => {
  const actual = await vi.importActual<typeof import("@/lib/access")>("@/lib/access");
  return {
    ...actual,
    getRequiredTier: (pathname: string) =>
      pathname === "/paywall" ? "basic" : actual.getRequiredTier(pathname),
  };
});

vi.mock("@/components/subscription/SubscriptionBanner", () => ({
  SubscriptionBanner: () => null,
}));

vi.mock("@/components/auth/LoginSheet", () => ({
  LoginSheet: () => <div data-testid="login-sheet">LoginSheet</div>,
}));

vi.mock("@/components/subscription/PaywallSheet", () => ({
  PaywallSheet: () => <div data-testid="paywall-sheet">PaywallSheet</div>,
}));

describe("AppLayout", () => {
  beforeEach(() => {
    currentPathname = "/search";
    termsRequired = false;
    authState.session = null;
    authState.subscriptionTier = "FREE";
    localStorage.setItem(ONBOARDING_KEY, "true");
    localStorage.removeItem(GUEST_PET_KEY);
    vi.clearAllMocks();
  });

  it("keeps the app layout free of route-level safe-top padding", () => {
    renderLayout(<div>Child</div>);

    expect(screen.getByText("Child").parentElement).not.toHaveClass("safe-top");
  });

  it("marks tab roots as tabbed shell without route-level pb-20", () => {
    currentPathname = "/search";

    renderLayout(<div>Child</div>);

    const shell = screen.getByTestId("app-shell");
    expect(shell).toHaveAttribute("data-shell-mode", "tabbed");
    expect(shell).not.toHaveClass("pb-20");
    expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeInTheDocument();
  });

  it("uses stacked shell for nested profile routes", () => {
    currentPathname = "/profile/about";

    renderLayout(<div>Child</div>);

    expect(screen.getByTestId("app-shell")).toHaveAttribute("data-shell-mode", "stacked");
    expect(screen.queryByRole("navigation", { name: /main navigation/i })).not.toBeInTheDocument();
  });

  it("renders BottomNav on normal app routes", () => {
    currentPathname = "/search";

    renderLayout(<div>Child</div>);

    expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeInTheDocument();
  });

  it("hides BottomNav on /profile/pets/edit", () => {
    currentPathname = "/profile/pets/edit";

    renderLayout(<div>Child</div>);

    expect(screen.queryByRole("navigation", { name: /main navigation/i })).not.toBeInTheDocument();
  });

  it("hides BottomNav on /profile/pets/edit with query parameter", () => {
    currentPathname = "/profile/pets/edit?id=pet-1";

    renderLayout(<div>Child</div>);

    expect(screen.queryByRole("navigation", { name: /main navigation/i })).not.toBeInTheDocument();
  });

  it("uses stacked shell on /profile/pets/editing", () => {
    currentPathname = "/profile/pets/editing";

    renderLayout(<div>Child</div>);

    expect(screen.getByTestId("app-shell")).toHaveAttribute("data-shell-mode", "stacked");
    expect(screen.queryByRole("navigation", { name: /main navigation/i })).not.toBeInTheDocument();
  });

  it("shows LoginSheet for login-gated routes", () => {
    currentPathname = "/profile";

    renderLayout(<div>Child</div>);

    expect(screen.getByTestId("login-sheet")).toBeInTheDocument();
  });

  it("does not auto-show PaywallSheet for paywall-gated routes", () => {
    currentPathname = "/paywall";
    authState.session = {
      user: {
        user_metadata: {},
      },
    };

    renderLayout(<div>Child</div>);

    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(screen.queryByTestId("paywall-sheet")).not.toBeInTheDocument();
    expect(screen.queryByTestId("login-sheet")).not.toBeInTheDocument();
  });

  it("redirects to /terms when terms gate is required", () => {
    termsRequired = true;

    renderLayout(<div>Child</div>);

    expect(routerReplace).toHaveBeenCalledWith("/terms");
  });

  it("redirects to /welcome when terms are not required and onboarding is incomplete", () => {
    termsRequired = false;
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(GUEST_PET_KEY);
    authState.session = null;

    renderLayout(<div>Child</div>);

    expect(routerReplace).toHaveBeenCalledWith("/welcome");
  });

  it("prioritizes terms redirect over onboarding redirect", () => {
    termsRequired = true;
    localStorage.removeItem("onboarding_completed");
    localStorage.removeItem(GUEST_PET_KEY);

    renderLayout(<div>Child</div>);

    expect(routerReplace).toHaveBeenCalledWith("/terms");
    expect(routerReplace).not.toHaveBeenCalledWith("/welcome");
  });
});
