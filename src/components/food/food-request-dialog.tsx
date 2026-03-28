"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFoodRequest } from "@/hooks/use-food-search";

interface FoodRequestDialogProps {
  open: boolean;
  onClose: () => void;
  initialFoodName?: string;
}

export function FoodRequestDialog({
  open,
  onClose,
  initialFoodName = "",
}: FoodRequestDialogProps) {
  const t = useTranslations();
  const [foodName, setFoodName] = useState(initialFoodName);
  const [error, setError] = useState("");
  const { isSubmitting, submitRequest } = useFoodRequest();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = foodName.trim();
    if (trimmed.length < 2) {
      setError("Food name must be at least 2 characters");
      return;
    }
    try {
      await submitRequest(trimmed);
      onClose();
    } catch {
      setError("Failed to submit request. Please try again.");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("requestFood")}>
      <p className="mb-4 text-sm text-txt-secondary">
        {t("requestFoodDescription")}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          value={foodName}
          onChange={(e) => {
            setFoodName(e.target.value);
            setError("");
          }}
          placeholder={t("foodNameHint")}
          label={t("foodName")}
          error={error}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t("submitRequest")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
