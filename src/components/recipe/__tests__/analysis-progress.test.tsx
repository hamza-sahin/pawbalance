import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysisProgress } from "../analysis-progress";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === "checkingIngredients" && values?.count) {
      return `checkingIngredients:${values.count}`;
    }
    return key;
  },
}));

vi.mock("../scattered-paws", () => ({
  ScatteredPaws: () => <div>ScatteredPaws</div>,
}));

vi.mock("../analysis-report", () => ({
  AnalysisReport: () => <div>AnalysisReport</div>,
}));

vi.mock("../checkmark-celebration", () => ({
  CheckmarkCelebration: ({ onComplete }: { onComplete: () => void }) => (
    <button type="button" onClick={onComplete}>
      FinishCelebration
    </button>
  ),
}));

describe("AnalysisProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("renders footer actions after the celebration transitions into the report", async () => {
    render(
      <AnalysisProgress
        recipeName="Chicken Bowl"
        ingredients={[
          { id: "1", name: "chicken", status: "done", safety: "safe" },
        ]}
        result={{
          overall_safety: "safe",
          ingredients: [
            {
              name: "chicken",
              safety_level: "safe",
              preparation_ok: true,
              notes: "Looks safe.",
            },
          ],
          safety_alerts: [],
          preparation_warnings: [],
          benefits_summary: [],
          suggestions: [],
          follow_up_actions: [],
        }}
        status="completed"
        reportFooter={<div>FooterActions</div>}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(600);
    });

    fireEvent.click(screen.getByRole("button", { name: "FinishCelebration" }));

    expect(screen.getByText("AnalysisReport")).toBeInTheDocument();
    expect(screen.getByText("FooterActions")).toBeInTheDocument();
  });
});
