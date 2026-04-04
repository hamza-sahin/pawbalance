import { Icons, type IconName } from "@/components/ui/icon";

interface EmptyStateProps {
  icon: IconName;
  iconBg?: string;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, iconBg = "bg-primary/10", title, subtitle, action }: EmptyStateProps) {
  const Icon = Icons[icon];

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className={`flex h-[72px] w-[72px] items-center justify-center rounded-full ${iconBg}`}>
        <Icon className="h-8 w-8 text-txt-tertiary" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-txt">{title}</h3>
      <p className="max-w-[250px] text-sm text-txt-secondary">{subtitle}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-button bg-primary-btn px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 ease-out active:scale-95 active:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
