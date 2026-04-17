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
          activity_level: "MODERATE",
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
});
