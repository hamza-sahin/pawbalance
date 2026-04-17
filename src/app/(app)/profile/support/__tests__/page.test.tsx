import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import { buildSupportMailto } from "@/lib/support-mailto";
import SupportPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => ({ locale: "en" }),
}));

describe("SupportPage", () => {
  it("shows direct support actions and legal shortcuts", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SupportPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("2gurmepati@gmail.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /email support/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /terms of service/i })).toHaveAttribute(
      "href",
      "/terms-of-service",
    );
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/privacy-policy",
    );
  });

  it("requires subject and message before launching a support draft", async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SupportPage />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /send support request/i }));

    expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
    expect(screen.getByText(/message is required/i)).toBeInTheDocument();
  });

  it("builds a prefilled support mailto link with subject, version, and locale", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockReturnValue(window);

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SupportPage />
      </NextIntlClientProvider>,
    );

    await user.type(screen.getByLabelText(/^subject$/i), "Billing issue");
    await user.type(screen.getByLabelText(/^message$/i), "The app store purchase did not unlock.");
    await user.click(screen.getByRole("button", { name: /send support request/i }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("mailto:2gurmepati@gmail.com?subject=PawBalance+Support%3A+Billing+issue"),
      "_self",
    );
    expect(openSpy.mock.calls[0][0]).toContain("Locale%3A+en");
    expect(openSpy.mock.calls[0][0]).toContain("Version%3A+1.0.0");
  });

  it("shows fallback copy when mail launch throws", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "open").mockImplementation(() => {
      throw new Error("blocked");
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SupportPage />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /email support/i }));

    expect(screen.getByText(/email us directly at 2gurmepati@gmail.com/i)).toBeInTheDocument();
  });

  it("adds iOS capitalization hints to support form fields", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SupportPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText(/^subject$/i)).toHaveAttribute(
      "autocapitalize",
      "words",
    );
    expect(screen.getByLabelText(/^message$/i)).toHaveAttribute(
      "autocapitalize",
      "sentences",
    );
  });

  it("exports a locale-aware support mailto builder", () => {
    const href = buildSupportMailto("Billing issue", "Body copy", "en");

    expect(href).toContain("mailto:2gurmepati@gmail.com");
    expect(href).toContain("PawBalance+Support%3A+Billing+issue");
    expect(href).toContain("Locale%3A+en");
    expect(href).toContain("Version%3A+1.0.0");
  });
});
