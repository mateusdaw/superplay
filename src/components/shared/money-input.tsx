"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import {
  formatInputFromCents,
  parseCurrencyInput,
  type Cents,
} from "@/lib/money";
import { cn } from "@/lib/utils";

interface MoneyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: Cents;
  onValueChange: (value: Cents) => void;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, className, onBlur, onFocus, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() =>
      formatInputFromCents(value)
    );
    const focusedRef = React.useRef(false);

    React.useEffect(() => {
      if (!focusedRef.current) {
        setDisplayValue(formatInputFromCents(value));
      }
    }, [value]);

    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--muted)]">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          className={cn("pl-11 tabular-nums", className)}
          onChange={(event) => {
            const nextDisplayValue = event.target.value;
            setDisplayValue(nextDisplayValue);
            onValueChange(parseCurrencyInput(nextDisplayValue));
          }}
          onFocus={(event) => {
            focusedRef.current = true;
            onFocus?.(event);
          }}
          onBlur={(event) => {
            focusedRef.current = false;
            const parsed = parseCurrencyInput(event.target.value);
            setDisplayValue(formatInputFromCents(parsed));
            onValueChange(parsed);
            onBlur?.(event);
          }}
          {...props}
        />
      </div>
    );
  }
);
MoneyInput.displayName = "MoneyInput";

export default MoneyInput;
