import { shouldShowBottomNav } from "../navigation";

describe("shouldShowBottomNav", () => {
  it("hides bottom nav on pet edit routes", () => {
    expect(shouldShowBottomNav("/profile/pets/edit?id=pet-1")).toBe(false);
    expect(shouldShowBottomNav("/profile/pets/edit")).toBe(false);
  });

  it("keeps bottom nav on regular app routes", () => {
    expect(shouldShowBottomNav("/profile")).toBe(true);
    expect(shouldShowBottomNav("/profile/pets")).toBe(true);
    expect(shouldShowBottomNav("/search")).toBe(true);
  });
});
