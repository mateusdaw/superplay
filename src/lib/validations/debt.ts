import { z } from "zod";

import type { DebtStatus } from "@/types/database";

export const debtStatusSchema = z.enum([
  "active",
  "paid",
  "overdue",
  "renegotiated",
]) satisfies z.ZodType<DebtStatus>;

export const debtFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome da divida."),
    creditor: z.string().trim().min(2, "Informe o credor."),
    original_amount_cents: z.number().int().min(1, "Informe o valor original."),
    current_balance_cents: z.number().int().min(0, "Informe o saldo atual."),
    interest_rate_annual: z.number().min(0, "Informe uma taxa valida."),
    installment_amount_cents: z.number().int().min(1, "Informe o valor da parcela."),
    total_installments: z.number().int().min(1, "Informe o total de parcelas."),
    paid_installments: z.number().int().min(0, "Informe parcelas pagas validas."),
    due_day: z.number().int().min(1, "Dia invalido.").max(31, "Dia invalido."),
    start_date: z.string().min(1, "Informe a data de inicio."),
    notes: z.string().nullable(),
    status: debtStatusSchema,
  })
  .refine((value) => value.current_balance_cents <= value.original_amount_cents, {
    path: ["current_balance_cents"],
    message: "O saldo atual nao pode exceder o valor original.",
  })
  .refine((value) => value.paid_installments <= value.total_installments, {
    path: ["paid_installments"],
    message: "Parcelas pagas nao podem exceder o total.",
  });

export type DebtFormValues = z.infer<typeof debtFormSchema>;

export const debtDefaultValues: DebtFormValues = {
  name: "",
  creditor: "",
  original_amount_cents: 0,
  current_balance_cents: 0,
  interest_rate_annual: 0,
  installment_amount_cents: 0,
  total_installments: 1,
  paid_installments: 0,
  due_day: 1,
  start_date: "",
  notes: null,
  status: "active",
};
