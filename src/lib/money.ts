const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERCENT = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const NUMBER = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Store money as integer cents — never use floats for currency math. */
export type Cents = number;

export function reaisToCents(value: number | string): Cents {
  if (typeof value === "string") {
    const normalized = value
      .replace(/\s/g, "")
      .replace(/R\$\s?/i, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    if (Number.isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }
  return Math.round(value * 100);
}

export function centsToReais(cents: Cents): number {
  return cents / 100;
}

export function formatCurrency(cents: Cents): string {
  return BRL.format(centsToReais(cents));
}

export function formatCurrencyCompact(cents: Cents): string {
  const reais = centsToReais(cents);
  if (Math.abs(reais) >= 1_000_000) {
    return `R$ ${NUMBER.format(reais / 1_000_000)} mi`;
  }
  if (Math.abs(reais) >= 10_000) {
    return `R$ ${NUMBER.format(reais / 1_000)} mil`;
  }
  return formatCurrency(cents);
}

export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return "—";
  return PERCENT.format(ratio);
}

export function formatPercentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 1;
  return (current - previous) / Math.abs(previous);
}

export function addCents(...values: Cents[]): Cents {
  return values.reduce((sum, v) => sum + v, 0);
}

export function subtractCents(a: Cents, b: Cents): Cents {
  return a - b;
}

export function absCents(value: Cents): Cents {
  return Math.abs(value);
}

export function parseCurrencyInput(input: string): Cents {
  return reaisToCents(input);
}

export function formatInputFromCents(cents: Cents): string {
  return NUMBER.format(centsToReais(cents));
}
