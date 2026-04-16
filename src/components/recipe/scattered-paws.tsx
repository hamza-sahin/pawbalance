"use client";

const PAW_PATH =
  "M7 5C7 3.34 5.88 2 4.5 2S2 3.34 2 5s1.12 3 2.5 3S7 6.66 7 5zm10 0c0-1.66-1.12-3-2.5-3S12 3.34 12 5s1.12 3 2.5 3S17 6.66 17 5zM4 12c0-1.66-1.12-3-2.5-3S-1 10.34-1 12s1.12 3 2.5 3S4 13.66 4 12zm20 0c0-1.66-1.12-3-2.5-3S19 10.34 19 12s1.12 3 2.5 3S24 13.66 24 12zM12 20c-4 0-7-3-7-6s2-4 4-3c1 .5 2 1.5 3 1.5s2-1 3-1.5c2-1 4 0 4 3s-3 6-7 6z";

interface PawConfig {
  top: string;
  left?: string;
  right?: string;
  opacity: number;
  size: number;
  rotation: number;
  animationDuration: string;
  animationDelay: string;
}

const PAWS: PawConfig[] = [
  { top: "8%", left: "5%", opacity: 0.06, size: 28, rotation: 0, animationDuration: "6s", animationDelay: "0s" },
  { top: "35%", right: "8%", opacity: 0.05, size: 22, rotation: 15, animationDuration: "8s", animationDelay: "0s" },
  { top: "65%", left: "10%", opacity: 0.04, size: 32, rotation: -20, animationDuration: "7s", animationDelay: "0s" },
  { top: "15%", right: "25%", opacity: 0.04, size: 18, rotation: 30, animationDuration: "9s", animationDelay: "1s" },
  { top: "50%", left: "75%", opacity: 0.035, size: 20, rotation: 45, animationDuration: "10s", animationDelay: "3s" },
  { top: "80%", right: "15%", opacity: 0.05, size: 24, rotation: -10, animationDuration: "7s", animationDelay: "2s" },
];

export function ScatteredPaws({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      {PAWS.map((paw, i) => (
        <svg
          key={i}
          className="absolute motion-safe:animate-float"
          style={{
            top: paw.top,
            left: paw.left,
            right: paw.right,
            opacity: paw.opacity,
            width: paw.size,
            height: paw.size,
            transform: `rotate(${paw.rotation}deg)`,
            animationDuration: paw.animationDuration,
            animationDelay: paw.animationDelay,
          }}
          viewBox="0 0 24 24"
          fill="var(--color-primary)"
        >
          <path d={PAW_PATH} />
        </svg>
      ))}
    </div>
  );
}
