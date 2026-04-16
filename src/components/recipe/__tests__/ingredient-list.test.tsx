import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { IngredientList } from "../ingredient-list";

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
}));

interface RenderIngredientListOptions {
  initialIngredients?: { name: string; preparation: string }[];
  onChange?: (ingredients: { name: string; preparation: string }[]) => void;
}

function IngredientListHarness({
  initialIngredients = [{ name: "Chicken", preparation: "Raw" }],
  onChange,
}: {
  initialIngredients?: { name: string; preparation: string }[];
  onChange?: (ingredients: { name: string; preparation: string }[]) => void;
}) {
  const [ingredients, setIngredients] = useState(initialIngredients);

  return (
    <IngredientList
      ingredients={ingredients}
      onChange={(nextIngredients) => {
        setIngredients(nextIngredients);
        onChange?.(nextIngredients);
      }}
    />
  );
}

function renderIngredientList(options: RenderIngredientListOptions = {}) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <IngredientListHarness
        initialIngredients={options.initialIngredients}
        onChange={options.onChange}
      />
    </NextIntlClientProvider>,
  );
}

function getEditButton(name: string) {
  return screen.getByRole("button", {
    name: new RegExp(`edit ingredient ${name}`, "i"),
  });
}

it("opens the add ingredient dialog from the add flow", async () => {
  renderIngredientList();

  await userEvent.click(screen.getByRole("button", { name: /add ingredient/i }));

  expect(
    screen.getByRole("dialog", { name: /add ingredient/i }),
  ).toBeInTheDocument();
});

it("opens the add ingredient sheet from the empty state flow", async () => {
  renderIngredientList({ initialIngredients: [] });

  expect(
    screen.getByRole("heading", { name: /ingredients/i, level: 2 }),
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /add ingredient/i }));

  expect(
    screen.getByRole("dialog", { name: /add ingredient/i }),
  ).toBeInTheDocument();
});

it("prepends a new ingredient and closes the sheet after add", async () => {
  const handleChange = vi.fn();

  renderIngredientList({ onChange: handleChange });

  await userEvent.click(screen.getByRole("button", { name: /add ingredient/i }));
  const dialog = screen.getByRole("dialog", { name: /add ingredient/i });
  await userEvent.type(
    within(dialog).getByRole("textbox", { name: /ingredient name/i }),
    "Salmon",
  );
  await userEvent.click(within(dialog).getByRole("button", { name: /boiled/i }));
  await userEvent.click(within(dialog).getByRole("button", { name: /^add ingredient$/i }));

  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: /add ingredient/i }),
    ).not.toBeInTheDocument(),
  );

  expect(handleChange).toHaveBeenLastCalledWith([
    { name: "Salmon", preparation: "Boiled" },
    { name: "Chicken", preparation: "Raw" },
  ]);

  const rows = within(screen.getByRole("list", { name: /ingredients/i })).getAllByRole(
    "listitem",
  );
  expect(rows).toHaveLength(2);
  expect(within(rows[0]).getByText("Salmon")).toBeInTheDocument();
  expect(within(rows[0]).getByText("Boiled")).toBeInTheDocument();
  expect(
    within(rows[0]).getByRole("button", { name: /remove ingredient salmon/i }),
  ).toBeInTheDocument();
  expect(within(rows[1]).getByText("Chicken")).toBeInTheDocument();
});

it("auto-saves a valid expanded row before switching to another row", async () => {
  const handleChange = vi.fn();

  renderIngredientList({
    initialIngredients: [
      { name: "Chicken", preparation: "Raw" },
      { name: "Rice", preparation: "Boiled" },
    ],
    onChange: handleChange,
  });

  await userEvent.click(
    getEditButton("Chicken"),
  );

  const chickenInput = screen.getByRole("textbox", {
    name: /ingredient name/i,
  });
  await userEvent.clear(chickenInput);
  await userEvent.type(chickenInput, "Chicken Breast");

  await userEvent.click(
    getEditButton("Rice"),
  );

  await waitFor(() =>
    expect(handleChange).toHaveBeenCalledWith([
      { name: "Chicken Breast", preparation: "Raw" },
      { name: "Rice", preparation: "Boiled" },
    ]),
  );

  expect(screen.getByDisplayValue("Rice")).toBeInTheDocument();
  expect(screen.getByText("Chicken Breast")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /save changes/i }),
  ).toBeInTheDocument();
});

it("keeps the invalid expanded row open and blocks switching", async () => {
  const handleChange = vi.fn();

  renderIngredientList({
    initialIngredients: [
      { name: "Chicken", preparation: "Raw" },
      { name: "Rice", preparation: "Boiled" },
    ],
    onChange: handleChange,
  });

  await userEvent.click(
    getEditButton("Chicken"),
  );

  const chickenInput = screen.getByRole("textbox", {
    name: /ingredient name/i,
  });
  await userEvent.clear(chickenInput);

  await userEvent.click(
    getEditButton("Rice"),
  );

  expect(handleChange).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox", { name: /ingredient name/i })).toHaveValue(
    "",
  );
  expect(screen.queryByDisplayValue("Rice")).not.toBeInTheDocument();
  expect(screen.getByText(/ingredient name is required/i)).toBeInTheDocument();
});

it("clears the expanded editor before prepending a new ingredient", async () => {
  const handleChange = vi.fn();

  renderIngredientList({
    initialIngredients: [
      { name: "Chicken", preparation: "Raw" },
      { name: "Rice", preparation: "Boiled" },
    ],
    onChange: handleChange,
  });

  await userEvent.click(getEditButton("Chicken"));

  const chickenInput = screen.getByRole("textbox", {
    name: /ingredient name/i,
  });
  await userEvent.clear(chickenInput);
  await userEvent.type(chickenInput, "Chicken Breast");

  await userEvent.click(screen.getByRole("button", { name: /add ingredient/i }));

  await waitFor(() =>
    expect(handleChange).toHaveBeenCalledWith([
      { name: "Chicken Breast", preparation: "Raw" },
      { name: "Rice", preparation: "Boiled" },
    ]),
  );
  expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();

  const dialog = screen.getByRole("dialog", { name: /add ingredient/i });
  await userEvent.type(
    within(dialog).getByRole("textbox", { name: /ingredient name/i }),
    "Salmon",
  );
  await userEvent.click(within(dialog).getByRole("button", { name: /boiled/i }));
  await userEvent.click(
    within(dialog).getByRole("button", { name: /^add ingredient$/i }),
  );

  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: /add ingredient/i }),
    ).not.toBeInTheDocument(),
  );

  const rows = within(screen.getByRole("list", { name: /ingredients/i })).getAllByRole(
    "listitem",
  );
  expect(within(rows[0]).getByText("Salmon")).toBeInTheDocument();
  expect(within(rows[1]).getByText("Chicken Breast")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();
});

it("blocks opening add ingredient when the expanded draft is invalid", async () => {
  renderIngredientList({
    initialIngredients: [
      { name: "Chicken", preparation: "Raw" },
      { name: "Rice", preparation: "Boiled" },
    ],
  });

  await userEvent.click(getEditButton("Chicken"));

  const chickenInput = screen.getByRole("textbox", {
    name: /ingredient name/i,
  });
  await userEvent.clear(chickenInput);

  await userEvent.click(screen.getByRole("button", { name: /add ingredient/i }));

  expect(screen.queryByRole("dialog", { name: /add ingredient/i })).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /ingredient name/i })).toHaveValue("");
  expect(screen.getByText(/ingredient name is required/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
});
