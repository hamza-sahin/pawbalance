"use client";

import { useTranslations } from "next-intl";
import { pickImage } from "@/lib/platform";
import { MAX_PET_PHOTO_SIZE_BYTES } from "@/lib/constants";

interface PhotoPickerProps {
  currentUrl: string | null;
  onPick: (dataUrl: string) => void;
  onRemove: () => void;
}

export function PhotoPicker({ currentUrl, onPick, onRemove }: PhotoPickerProps) {
  const t = useTranslations();

  async function handlePick() {
    const dataUrl = await pickImage();
    if (!dataUrl) return;

    // Check size (~75% of base64 length = actual bytes)
    const sizeEstimate = (dataUrl.length * 3) / 4;
    if (sizeEstimate > MAX_PET_PHOTO_SIZE_BYTES) {
      alert(t("imageTooLarge"));
      return;
    }
    onPick(dataUrl);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handlePick}
        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-surface-variant transition-colors hover:border-primary"
      >
        {currentUrl ? (
          <img
            src={currentUrl}
            alt="Pet photo"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-3xl text-txt-tertiary">🐾</span>
        )}
      </button>
      <p className="text-xs text-txt-tertiary">Add photo</p>
      {currentUrl && (
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-error hover:underline"
        >
          {t("removePhoto")}
        </button>
      )}
    </div>
  );
}
