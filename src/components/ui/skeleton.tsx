import type * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[rgba(148,163,184,0.14)]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
