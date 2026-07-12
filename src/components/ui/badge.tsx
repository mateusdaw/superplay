import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none tracking-tight",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(20,115,255,0.42)] bg-[rgba(20,115,255,0.16)] text-[#cfe2ff]",
        success:
          "border-[rgba(20,217,144,0.42)] bg-[rgba(20,217,144,0.14)] text-[#a8f7d8]",
        warning:
          "border-[rgba(245,158,11,0.42)] bg-[rgba(245,158,11,0.14)] text-[#fde3a3]",
        danger:
          "border-[rgba(255,90,111,0.42)] bg-[rgba(255,90,111,0.14)] text-[#ffc2ca]",
        muted:
          "border-[var(--card-border)] bg-[rgba(148,163,184,0.1)] text-[var(--muted)]",
        cyan: "border-[rgba(34,211,238,0.42)] bg-[rgba(34,211,238,0.14)] text-[#b6f3ff]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
