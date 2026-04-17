import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PageHeader } from "../page-header";

describe("PageHeader", () => {
  it("keeps sticky headers below the iOS safe area and uses a 44px back target", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(
      <PageHeader title="About" backLabel="Back" onBack={onBack} />,
    );

    const header = screen.getByRole("heading", { name: "About", level: 1 }).closest("div");

    expect(header).toHaveClass("safe-sticky-top");

    const backButton = screen.getByRole("button", { name: "Back" });

    expect(backButton).toHaveClass("h-11", "w-11");

    await user.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
