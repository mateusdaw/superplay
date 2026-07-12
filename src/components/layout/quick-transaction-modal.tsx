"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  transactionStatusLabels,
  transactionStatusOptions,
  transactionTypeLabels,
} from "@/lib/labels";
import { parseCurrencyInput } from "@/lib/money";
import { nowInSaoPaulo, toISODate } from "@/lib/date";
import { useFinance } from "@/contexts/finance-context";

const quickTransactionSchema = z.object({
  description: z.string().trim().min(3, "Informe uma descrição."),
  amount: z
    .string()
    .trim()
    .min(1, "Informe o valor.")
    .refine((value) => parseCurrencyInput(value) > 0, "Informe um valor válido."),
  type: z.enum(["income", "expense"]),
  categoryId: z.string(),
  accountId: z.string(),
  date: z.string().min(1, "Informe a data."),
  status: z.enum(["paid", "pending", "due_today", "overdue", "scheduled"]),
});

type QuickTransactionValues = z.infer<typeof quickTransactionSchema>;

type QuickTransactionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues: QuickTransactionValues = {
  description: "",
  amount: "",
  type: "expense",
  categoryId: "none",
  accountId: "none",
  date: toISODate(nowInSaoPaulo()),
  status: "paid",
};

export function QuickTransactionModal({
  open,
  onOpenChange,
}: QuickTransactionModalProps) {
  const { accounts, categories, addTransaction } = useFinance();
  const form = useForm<QuickTransactionValues>({
    resolver: zodResolver(quickTransactionSchema),
    defaultValues,
  });
  const selectedType = useWatch({ control: form.control, name: "type" });
  const categoryOptions = useMemo(
    () =>
      categories.filter(
        (category) => category.type === selectedType || category.type === "both"
      ),
    [categories, selectedType]
  );

  useEffect(() => {
    if (open) {
      form.reset({ ...defaultValues, date: toISODate(nowInSaoPaulo()) });
    }
  }, [form, open]);

  function onSubmit(values: QuickTransactionValues) {
    addTransaction({
      description: values.description,
      amount_cents: parseCurrencyInput(values.amount),
      type: values.type,
      category_id: values.categoryId === "none" ? null : values.categoryId,
      subcategory_id: null,
      date: values.date,
      due_date: values.status === "paid" ? null : values.date,
      payment_date: values.status === "paid" ? values.date : null,
      account_id: values.accountId === "none" ? null : values.accountId,
      credit_card_id: null,
      payment_method: "pix",
      status: values.status,
      notes: null,
      attachment_url: null,
      is_recurring: false,
      installment_total: null,
      installment_current: null,
      parent_transaction_id: null,
      tags: [],
    });

    toast.success("Transação adicionada", {
      description: `${values.description} foi registrada com sucesso.`,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar transação</DialogTitle>
          <DialogDescription>
            Registre rapidamente uma receita ou despesa em reais.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex.: Supermercado, salário, assinatura..."
              {...form.register("description")}
            />
            <FieldError message={form.formState.errors.description?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor (BRL)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="0,00"
                {...form.register("amount")}
              />
              <FieldError message={form.formState.errors.amount?.message} />
            </div>

            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["expense", "income"] as const).map((type) => (
                        <SelectItem key={type} value={type}>
                          {transactionTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <div className="grid gap-2">
                  <Label>Conta</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar conta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem conta</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" {...form.register("date")} />
              <FieldError message={form.formState.errors.date?.message} />
            </div>

            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {transactionStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {transactionStatusLabels[option.value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar transação</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-semibold text-[#ffc2ca]">{message}</p>;
}
