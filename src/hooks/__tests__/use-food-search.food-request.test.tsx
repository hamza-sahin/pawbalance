import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFoodRequest } from "../use-food-search";

const { insertMock, fromMock, getStateMock } = vi.hoisted(() => {
  const insertMock = vi.fn();
  const fromMock = vi.fn(() => ({ insert: insertMock }));
  const getStateMock = vi.fn();

  return { insertMock, fromMock, getStateMock };
});

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: fromMock,
  }),
}));

vi.mock("@/store/auth-store", () => ({
  useAuthStore: {
    getState: getStateMock,
  },
}));

describe("useFoodRequest", () => {
  beforeEach(() => {
    fromMock.mockClear();
    insertMock.mockReset();
    getStateMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
  });

  it("includes the authenticated user id in the request payload", async () => {
    getStateMock.mockReturnValue({ user: { id: "user-1" } });

    const { result } = renderHook(() => useFoodRequest());

    await act(async () => {
      await result.current.submitRequest("Quinoa");
    });

    expect(fromMock).toHaveBeenCalledWith("food_requests");
    expect(insertMock).toHaveBeenCalledWith({
      food_name: "Quinoa",
      user_id: "user-1",
    });
  });

  it("stores guest requests without a user id", async () => {
    getStateMock.mockReturnValue({ user: null });

    const { result } = renderHook(() => useFoodRequest());

    await act(async () => {
      await result.current.submitRequest("Dragon fruit");
    });

    expect(insertMock).toHaveBeenCalledWith({
      food_name: "Dragon fruit",
      user_id: null,
    });
  });
});
