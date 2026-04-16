"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface CheckmarkCelebrationProps {
  onComplete: () => void;
}

export function CheckmarkCelebration({ onComplete }: CheckmarkCelebrationProps) {
  const t = useTranslations();
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const enterTimer = requestAnimationFrame(() => setPhase("enter"));

    const exitTimer = setTimeout(() => {
      setPhase("exit");
    }, 1800);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-canvas transition-opacity duration-[600ms] ease-out ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary"
        style={{
          animation: "checkmark-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M10 20 L17 27 L30 13"
            className="motion-safe:animate-checkmark-draw"
          />
        </svg>
      </div>

      <p
        className="mt-4 text-[17px] font-semibold text-txt"
        style={{
          animation: "checkmark-text 0.4s ease 0.7s both",
        }}
      >
        {t("analysisComplete")}
      </p>

      <div
        className="absolute h-20 w-20 rounded-full border-2 border-primary"
        style={{
          animation: "ring-burst 0.8s ease-out 0.4s both",
        }}
      />
    </div>
  );
}
