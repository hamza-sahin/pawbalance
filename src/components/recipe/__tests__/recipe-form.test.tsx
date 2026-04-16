import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import messages from "@/messages/en.json";
import { RecipeForm } from "../recipe-form";

vi.mock("@/store/pet-store", () => ({
  usePetStore: vi.fn(() => ({
    pets: [
      { id: "pet-1", name: "Milo" },
      { id: "pet-2", name: "Luna" },
    ],
  })),
}));

function renderRecipeForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RecipeForm onSubmit={vi.fn().mockResolvedValue(undefined)} />
    </NextIntlClientProvider>,
  );
}

it("renders ingredient list between pet selection and save action with empty-state copy", () => {
  renderRecipeForm();

  expect(screen.getByRole("button", { name: "Milo" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Luna" })).toBeInTheDocument();

  const ingredientsHeading = screen.getByRole("heading", {
    name: /ingredients/i,
    level: 2,
  });
  const saveButton = screen.getByRole("button", { name: /save recipe/i });

  expect(
    ingredientsHeading.compareDocumentPosition(saveButton) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(screen.getByText("0 ingredients")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /add ingredient/i })[0]).toBeInTheDocument();
  expect(screen.getByText(/no ingredients added yet/i)).toBeInTheDocument();
});
