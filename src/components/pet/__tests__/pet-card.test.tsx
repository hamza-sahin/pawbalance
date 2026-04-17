import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "@/messages/en.json";
import { PetCard } from "@/components/pet/pet-card";
import type { Pet } from "@/lib/types";

function renderPetCard(pet: Pet) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PetCard pet={pet} />
    </NextIntlClientProvider>,
  );
}

function buildPet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: "pet-1",
    owner_id: "user-1",
    name: "Milo",
    breed: "Beagle",
    age_months: 24,
    birth_date: null,
    weight_kg: 12,
    gender: "MALE",
    is_neutered: true,
    body_condition_score: 5,
    activity_level: "MODERATE_LOW_IMPACT",
    expected_adult_weight_kg: null,
    reproductive_state: "MAINTENANCE",
    gestation_week: null,
    lactation_week: null,
    litter_size: null,
    known_allergies: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("PetCard", () => {
  it("shows an official calorie hint for adult dogs", () => {
    renderPetCard(buildPet());

    expect(screen.getByText(/official fediaf estimate/i)).toBeInTheDocument();
  });

  it("shows fallback guidance for puppies missing expected adult weight", () => {
    renderPetCard(buildPet({
      name: "Poppy",
      age_months: 8,
      weight_kg: 10,
      gender: "FEMALE",
      is_neutered: false,
    }));

    expect(screen.getByText(/approximate estimate/i)).toBeInTheDocument();
  });

  it("shows unavailable guidance when required reproductive fields are missing", () => {
    renderPetCard(buildPet({
      gender: "FEMALE",
      is_neutered: false,
      reproductive_state: "GESTATION",
      gestation_week: null,
    }));

    expect(screen.getByText(/complete the missing profile fields/i)).toBeInTheDocument();
  });
});
