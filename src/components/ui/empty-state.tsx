import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "glass-card flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-[rgba(20,115,255,0.28)] bg-[rgba(20,115,255,0.12)] text-[var(--cyan)]">
        <Icon className="size-7" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
