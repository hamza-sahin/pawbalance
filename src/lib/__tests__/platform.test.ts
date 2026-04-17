import { beforeEach, describe, expect, it, vi } from "vitest";

const getPlatform = vi.fn();
const isNativePlatform = vi.fn();

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    getPlatform,
    isNativePlatform,
  },
}));

describe("platform helpers", () => {
  beforeEach(() => {
    getPlatform.mockReset();
    isNativePlatform.mockReset();
  });

  it("returns true only for native iOS", async () => {
    vi.resetModules();
    isNativePlatform.mockReturnValue(true);
    getPlatform.mockReturnValue("ios");

    const { isIOSNative } = await import("../platform");
    expect(isIOSNative).toBe(true);
  });

  it("returns false for android and web", async () => {
    vi.resetModules();
    isNativePlatform.mockReturnValue(true);
    getPlatform.mockReturnValue("android");

    const androidPlatform = await import("../platform");
    expect(androidPlatform.isIOSNative).toBe(false);

    vi.resetModules();
    isNativePlatform.mockReturnValue(false);
    getPlatform.mockReturnValue("web");

    const webPlatform = await import("../platform");
    expect(webPlatform.isIOSNative).toBe(false);
  });
});
