"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[rgba(20,115,255,0.42)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_14px_34px_rgba(20,115,255,0.28)] hover:bg-[#2c82ff] hover:shadow-[0_18px_44px_rgba(20,115,255,0.34)]",
        secondary:
          "border border-[var(--card-border)] bg-[rgba(100,130,255,0.12)] text-[var(--foreground)] hover:border-[rgba(100,130,255,0.35)] hover:bg-[rgba(100,130,255,0.18)]",
        outline:
          "border border-[var(--card-border)] bg-transparent text-[var(--foreground)] hover:border-[rgba(20,115,255,0.55)] hover:bg-[rgba(20,115,255,0.1)]",
        ghost:
          "border border-transparent bg-transparent text-[var(--muted)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--foreground)]",
        danger:
          "border border-[rgba(255,90,111,0.44)] bg-[rgba(255,90,111,0.16)] text-[#ffb7c1] hover:bg-[rgba(255,90,111,0.24)] hover:text-white",
        success:
          "border border-[rgba(20,217,144,0.42)] bg-[rgba(20,217,144,0.16)] text-[#a8f7d8] hover:bg-[rgba(20,217,144,0.24)] hover:text-white",
      },
      size: {
        sm: "h-9 rounded-xl px-3 text-xs",
        md: "h-11 px-5",
        lg: "h-13 rounded-[22px] px-7 text-base",
        icon: "size-11 rounded-2xl p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
