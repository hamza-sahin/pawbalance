import { getAppShellMode, shouldShowBottomNav } from "../navigation";

describe("getAppShellMode", () => {
  it("marks tab roots as tabbed", () => {
    expect(getAppShellMode("/profile")).toBe("tabbed");
    expect(getAppShellMode("/search")).toBe("tabbed");
    expect(getAppShellMode("/recipes")).toBe("tabbed");
    expect(getAppShellMode("/learn")).toBe("tabbed");
    expect(getAppShellMode("/scan")).toBe("tabbed");
  });

  it("marks nested app pages as stacked", () => {
    expect(getAppShellMode("/profile/about")).toBe("stacked");
    expect(getAppShellMode("/profile/language")).toBe("stacked");
    expect(getAppShellMode("/search/category")).toBe("stacked");
    expect(getAppShellMode("/learn/article")).toBe("stacked");
  });
 
  it("marks immersive flows and pet edit as immersive", () => {
    expect(getAppShellMode("/welcome")).toBe("immersive");
    expect(getAppShellMode("/onboarding")).toBe("immersive");
    expect(getAppShellMode("/terms")).toBe("immersive");
    expect(getAppShellMode("/profile/pets/edit?id=pet-1")).toBe("immersive");
  });
});

describe("shouldShowBottomNav", () => {
  it("shows bottom nav only on tabbed routes", () => {
    expect(shouldShowBottomNav("/profile")).toBe(true);
    expect(shouldShowBottomNav("/profile/about")).toBe(false);
    expect(shouldShowBottomNav("/welcome")).toBe(false);
    expect(shouldShowBottomNav("/profile/pets/edit")).toBe(false);
  });
});
