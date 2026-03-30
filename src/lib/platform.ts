import { Capacitor } from "@capacitor/core";

/**
 * True when running inside a Capacitor native shell (iOS/Android).
 * False when running in a regular browser.
 */
export const isNative =
  typeof window !== "undefined" && Capacitor.isNativePlatform();

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
export async function initOtaUpdates() {
  if (!isNative) return;

  const { CapacitorUpdater } = await import("@capgo/capacitor-updater");

  CapacitorUpdater.notifyAppReady();
}
