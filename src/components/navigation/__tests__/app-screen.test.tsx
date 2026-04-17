import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import trMessages from "@/messages/tr.json";
import { AppScreen } from "../app-screen";

let isIOSNativeMock = true;

vi.mock("@/lib/platform", () => ({
  get isIOSNative() {
    return isIOSNativeMock;
  },
}));

const back = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back,
    push,
  }),
}));

function renderScreen(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="tr" messages={trMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("AppScreen", () => {
  beforeEach(() => {
    back.mockReset();
    push.mockReset();
    isIOSNativeMock = true;
  });

  it("renders joined iOS chrome with localized back action", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    renderScreen(
      <AppScreen title="Terms of Service" showBack onBack={onBack} trailing={<span>Trailing</span>}>
        <div>Body</div>
      </AppScreen>,
    );

    const chrome = screen.getByTestId("app-screen-chrome");
    const heading = screen.getByRole("heading", { name: "Terms of Service", level: 1 });
    const backButton = screen.getByRole("button", { name: trMessages.back });

    expect(chrome).toHaveClass("ios-screen-chrome");
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("text-center");
    expect(backButton).toHaveClass("h-11", "w-11");
    expect(screen.getByText("Trailing")).toBeInTheDocument();

    await user.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("uses plain chrome off iOS and applies content spacing helpers", () => {
    isIOSNativeMock = false;

    renderScreen(
      <AppScreen title="Profile" showBack={false} contentClassName="px-4" withBottomNavSpacing>
        <div>Body</div>
      </AppScreen>,
    );

    const chrome = screen.getByTestId("app-screen-chrome");
    const content = screen.getByTestId("app-screen-content");

    expect(chrome).toHaveClass("screen-chrome");
    expect(chrome).not.toHaveClass("ios-screen-chrome");
    expect(content).toHaveClass("screen-body-with-tabbar");
    expect(content).toHaveClass("px-4");
    expect(within(content).getByText("Body")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: trMessages.back })).toBeNull();
  });

  it("uses router.back when no explicit back action is supplied", async () => {
    const user = userEvent.setup();

    renderScreen(
      <AppScreen title="Analysis" showBack>
        <div>Body</div>
      </AppScreen>,
    );

    await user.click(screen.getByRole("button", { name: trMessages.back }));

    expect(back).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("falls back to router navigation when onBack is omitted", async () => {
    const user = userEvent.setup();

    renderScreen(
      <AppScreen title="Analysis" showBack backHref="/recipes">
        <div>Body</div>
      </AppScreen>,
    );

    await user.click(screen.getByRole("button", { name: trMessages.back }));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/recipes");
    expect(back).not.toHaveBeenCalled();
  });

  it("prefers onBack over backHref when both are provided", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    renderScreen(
      <AppScreen title="Analysis" showBack onBack={onBack} backHref="/recipes">
        <div>Body</div>
      </AppScreen>,
    );

    await user.click(screen.getByRole("button", { name: trMessages.back }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
  });
});
