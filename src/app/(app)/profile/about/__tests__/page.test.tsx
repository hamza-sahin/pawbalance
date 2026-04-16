import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import AboutPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

describe("AboutPage", () => {
  it("shows app version from shared app info metadata", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("heading", { name: /about/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/PawBalance helps dog owners quickly check food safety/i)).toBeInTheDocument();
    expect(screen.getByText(/help pet owners make safer, more confident food and nutrition decisions/i)).toBeInTheDocument();
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
    expect(screen.getByText(/Hamza Sahin/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /terms of service/i })).toHaveAttribute(
      "href",
      "/terms-of-service",
    );
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/privacy-policy",
    );
  });
});
