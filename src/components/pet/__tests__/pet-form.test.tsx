import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import { PetForm } from "../pet-form";

function renderPetForm() {
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PetForm
        pet={{
          id: "pet-1",
          owner_id: "user-1",
          name: "Milo",
          breed: "Beagle",
          age_months: 24,
          weight_kg: 12,
          gender: "MALE",
          is_neutered: true,
          body_condition_score: 5,
          activity_level: "MODERATE_LOW_IMPACT",
          known_allergies: null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }}
        onSubmit={onSubmit}
      />
    </NextIntlClientProvider>,
  );

  return { onSubmit };
}

describe("PetForm", () => {
  it("does not submit while advancing from gender to activity step", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderPetForm();

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("radio", { name: /female/i }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    await waitFor(() => {
      expect(screen.getByText(/body condition score/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows expected adult weight for puppies and submits it", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PetForm onSubmit={onSubmit} />
      </NextIntlClientProvider>,
    );

    await user.type(screen.getByLabelText(/name/i), "Poppy");
    await user.type(screen.getByLabelText(/age/i), "8");
    await user.type(screen.getAllByLabelText(/weight/i)[0], "10");

    expect(screen.getByLabelText(/expected adult weight/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/expected adult weight/i), "20");
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("radio", { name: "♂ Male" }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("radio", { name: /^moderate$/i }));
    await user.click(screen.getByRole("button", { name: /get started/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        expected_adult_weight_kg: 20,
      }),
      null,
      false,
    );
  });

  it("submits age_months as 0 when newborn age is entered", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PetForm onSubmit={onSubmit} />
      </NextIntlClientProvider>,
    );

    await user.type(screen.getByLabelText(/name/i), "Tiny");
    await user.type(screen.getByLabelText(/age/i), "0");
    await user.type(screen.getAllByLabelText(/weight/i)[0], "4");

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("radio", { name: "♂ Male" }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("radio", { name: /^moderate$/i }));
    await user.click(screen.getByRole("button", { name: /get started/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        age_months: 0,
      }),
      null,
      false,
    );
  });

  it("shows reproduction fields only for intact females", async () => {
    const user = userEvent.setup();
    renderPetForm();

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("radio", { name: /female/i }));
    expect(screen.queryByRole("radiogroup", { name: /reproductive state/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /neutered/i }));

    expect(screen.getByRole("radiogroup", { name: /reproductive state/i })).toBeInTheDocument();
  });
});
