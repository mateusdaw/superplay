"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-32 w-full resize-y rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.72)] px-4 py-3 text-sm font-medium text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors placeholder:text-[var(--muted-foreground)] focus-visible:border-[rgba(20,115,255,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(20,115,255,0.28)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
