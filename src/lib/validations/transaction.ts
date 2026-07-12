import { z } from "zod";

import type { PaymentMethod, TransactionStatus, TransactionType } from "@/types/database";

export const transactionTypeSchema = z.enum(["income", "expense"]) satisfies z.ZodType<TransactionType>;
export const transactionStatusSchema = z.enum([
  "paid",
  "pending",
  "due_today",
  "overdue",
  "scheduled",
]) satisfies z.ZodType<TransactionStatus>;
export const paymentMethodSchema = z.enum([
  "pix",
  "debit",
  "credit",
  "boleto",
  "transfer",
  "cash",
  "other",
]) satisfies z.ZodType<PaymentMethod>;

export const transactionFormSchema = z
  .object({
    description: z.string().trim().min(2, "Informe uma descricao."),
    amount_cents: z.number().int().min(1, "Informe um valor maior que zero."),
    type: transactionTypeSchema,
    category_id: z.string().nullable(),
    subcategory_id: z.string().nullable(),
    date: z.string().min(1, "Informe a data."),
    due_date: z.string().nullable(),
    payment_date: z.string().nullable(),
    account_id: z.string().nullable(),
    credit_card_id: z.string().nullable(),
    payment_method: paymentMethodSchema.nullable(),
    status: transactionStatusSchema,
    notes: z.string().nullable(),
    is_recurring: z.boolean(),
    installment_total: z.number().int().min(1).nullable(),
    installment_current: z.number().int().min(1).nullable(),
    tags: z.string(),
  })
  .refine(
    (value) =>
      !value.installment_total ||
      !value.installment_current ||
      value.installment_current <= value.installment_total,
    {
      path: ["installment_current"],
      message: "A parcela atual nao pode ser maior que o total.",
    }
  );

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export const transactionDefaultValues: TransactionFormValues = {
  description: "",
  amount_cents: 0,
  type: "expense",
  category_id: null,
  subcategory_id: null,
  date: "",
  due_date: null,
  payment_date: null,
  account_id: null,
  credit_card_id: null,
  payment_method: null,
  status: "paid",
  notes: null,
  is_recurring: false,
  installment_total: null,
  installment_current: null,
  tags: "",
};
