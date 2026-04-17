import { Capacitor } from "@capacitor/core";

/**
 * True when running inside a Capacitor native shell (iOS/Android).
 * False when running in a regular browser.
 */
export const isNative =
  typeof window !== "undefined" && Capacitor.isNativePlatform();

export const isIOSNative =
  typeof window !== "undefined" &&
  isNative &&
  Capacitor.getPlatform() === "ios";

/**
 * Pick an image via native camera (Capacitor) or file input (web).
 * Returns a data-URL string or null if cancelled.
 */
export async function pickImage(): Promise<string | null> {
  if (isNative) {
    const { Camera, CameraResultType, CameraSource } = await import(
      "@capacitor/camera"
    );
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        quality: 80,
      });
      return photo.dataUrl ?? null;
    } catch {
      return null; // user cancelled
    }
  }

  // Web fallback: hidden file input
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

/**
 * Initialize Capgo OTA updates.
 * Only runs on native platforms (iOS/Android).
 * Call this once on app startup.
 */
/**
 * Callback invoked when a Capgo OTA update has been downloaded
 * and is ready to apply. The app calls this to decide whether
 * to prompt the user or silently apply on next restart.
 */
let onUpdateReady: (() => void) | null = null;

export function setOnUpdateReady(cb: () => void) {
  onUpdateReady = cb;
}

export async function initOtaUpdates() {
  if (!isNative) return;

  const { CapacitorUpdater } = await import("@capgo/capacitor-updater");

  CapacitorUpdater.notifyAppReady();

  // When a new bundle is downloaded, notify the app so it can prompt the user
  CapacitorUpdater.addListener("updateAvailable", async (update) => {
    // Set the bundle to be used on next launch
    await CapacitorUpdater.set({ id: update.bundle.id });
    // Notify the UI to show a restart prompt
    onUpdateReady?.();
  });
}

export async function reloadApp() {
  if (!isNative) return;
  const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
  await CapacitorUpdater.reload();
}
