import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "@/messages/en.json";
import { BreedSelector } from "@/components/pet/breed-selector";
import { Input } from "../input";
import { PasswordInput } from "../password-input";

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("text input capitalization", () => {
  it("defaults shared text inputs to word capitalization while keeping non-text inputs off", () => {
    const { rerender } = render(
      <Input label="Pet name" value="" onChange={() => undefined} />,
    );

    expect(screen.getByLabelText(/pet name/i)).toHaveAttribute(
      "autocapitalize",
      "words",
    );

    rerender(
      <Input
        label="Pet age"
        type="text"
        inputMode="numeric"
        value=""
        onChange={() => undefined}
      />,
    );

    expect(screen.getByLabelText(/pet age/i)).toHaveAttribute(
      "autocapitalize",
      "none",
    );

    rerender(
      <Input label="Email" type="email" value="" onChange={() => undefined} />,
    );

    expect(screen.getByLabelText(/email/i)).toHaveAttribute(
      "autocapitalize",
      "none",
    );
  });

  it("keeps password inputs from auto-capitalizing", () => {
    render(
      <PasswordInput label="Password" value="" onChange={() => undefined} />,
    );

    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
      "autocapitalize",
      "none",
    );
  });

  it("capitalizes breed lookups as words", () => {
    renderWithIntl(<BreedSelector value={null} onChange={() => undefined} />);

    expect(screen.getByRole("combobox")).toHaveAttribute(
      "autocapitalize",
      "words",
    );
  });
});
