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

    expect(screen.getByTestId("app-screen")).toHaveAttribute("data-shell-mode", "stacked");
    expect(chrome).toHaveClass("app-screen__chrome");
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("text-center");
    expect(backButton).toHaveClass("h-11", "w-11");
    expect(screen.getByText("Trailing")).toBeInTheDocument();

    await user.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders tabbed shell content without legacy bottom-spacing helper", () => {
    renderScreen(
      <AppScreen title="Profile" shellMode="tabbed" contentClassName="px-4">
        <div>Body</div>
      </AppScreen>,
    );

    const content = screen.getByTestId("app-screen-content");

    expect(screen.getByTestId("app-screen")).toHaveAttribute("data-shell-mode", "tabbed");
    expect(content).not.toHaveClass("screen-body-with-tabbar");
    expect(content).toHaveClass("px-4");
    expect(within(content).getByText("Body")).toBeInTheDocument();
  });

  it("supports immersive screens without header chrome", () => {
    renderScreen(
      <AppScreen shellMode="immersive" showHeader={false}>
        <div>Body</div>
      </AppScreen>,
    );

    expect(screen.getByTestId("app-screen")).toHaveAttribute("data-shell-mode", "immersive");
    expect(screen.queryByTestId("app-screen-chrome")).toBeNull();
    expect(screen.getByText("Body")).toBeInTheDocument();
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
