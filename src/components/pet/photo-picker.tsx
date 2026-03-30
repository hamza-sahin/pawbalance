"use client";

import { useTranslations } from "next-intl";
import { pickImage } from "@/lib/platform";
import { Icons } from "@/components/ui/icon";
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
        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-surface-variant transition-all duration-150 ease-out hover:border-primary active:scale-95 active:opacity-80"
      >
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={t("petPhoto")}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icons.paw className="h-8 w-8 text-txt-tertiary" aria-hidden="true" />
        )}
      </button>
      <p className="text-xs text-txt-tertiary">{t("addPhoto")}</p>
      {currentUrl && (
        <button
          type="button"
          onClick={onRemove}
          className="min-h-[44px] inline-flex items-center text-xs text-error transition-opacity duration-150 hover:underline active:opacity-50"
        >
          {t("removePhoto")}
        </button>
      )}
    </div>
  );
}
