"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRightLeft,
  Pill,
  Heart,
  AlertTriangle,
  Lightbulb,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  FollowUpAction,
  RecipeEditAction,
  DetailCardAction,
  DetailCardIcon,
} from "@/lib/types";

const ICON_MAP: Record<DetailCardIcon, typeof Pill> = {
  pill: Pill,
  heart: Heart,
  alert: AlertTriangle,
  lightbulb: Lightbulb,
  shield: Shield,
};

interface FollowUpActionsProps {
  actions: FollowUpAction[];
  onRecipeEdit: (action: RecipeEditAction) => void;
}

export function FollowUpActions({
  actions,
  onRecipeEdit,
}: FollowUpActionsProps) {
  const t = useTranslations();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const recipeEdits = actions.filter(
    (a): a is RecipeEditAction => a.type === "recipe_edit",
  );
  const detailCards = actions.filter(
    (a): a is DetailCardAction => a.type === "detail_card",
  );

  return (
    <div className="space-y-2">
      {/* Recipe edit actions */}
      {recipeEdits.map((action, i) => (
        <button
          key={`edit-${i}`}
          className="flex w-full cursor-pointer touch-manipulation items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-left transition-colors active:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={() => onRecipeEdit(action)}
        >
          <ArrowRightLeft className="h-5 w-5 flex-shrink-0 text-primary" />
          <p className="text-[13px] font-medium text-txt">{action.label}</p>
        </button>
      ))}

      {/* Detail cards */}
      {detailCards.map((action, i) => {
        const Icon = ICON_MAP[action.icon];
        const globalIndex = recipeEdits.length + i;
        const isExpanded = expandedIndex === globalIndex;

        return (
          <button
            key={`detail-${i}`}
            className="w-full cursor-pointer touch-manipulation rounded-xl border border-border bg-surface p-3.5 text-left transition-colors active:bg-canvas focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() =>
              setExpandedIndex(isExpanded ? null : globalIndex)
            }
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 flex-shrink-0 text-txt-secondary" />
              <p className="flex-1 text-[13px] font-medium text-txt">
                {action.label}
              </p>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-txt-tertiary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-txt-tertiary" />
              )}
            </div>
            {isExpanded && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-[13px] leading-relaxed text-txt-secondary">
                  {action.detail}
                </p>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
