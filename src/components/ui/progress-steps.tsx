interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="mb-6 flex items-center gap-2" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps.length}>
      {steps.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={`h-1.5 w-full rounded-full transition-colors ${
              i <= currentStep ? "bg-primary" : "bg-border"
            }`}
          />
          <span className={`text-[10px] ${i <= currentStep ? "font-medium text-primary" : "text-txt-tertiary"}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
