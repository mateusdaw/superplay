"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarClock,
  CheckCircle2,
  Edit3,
  MoreHorizontal,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoneyInput } from "@/components/shared/money-input";
import { useFinance } from "@/contexts/finance-context";
import { fixedExpensesSummary, sumByType } from "@/lib/calculations";
import { formatDate, nowInSaoPaulo, toISODate } from "@/lib/date";
import { recurrenceLabels, recurrenceOptions } from "@/lib/labels";
import { formatCurrency, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Account, Category, Recurrence, RecurringExpense } from "@/types/database";

const NONE_VALUE = "__none";

const recurringExpenseSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome."),
    amount_cents: z.number().int().min(1, "Informe um valor maior que zero."),
    category_id: z.string().nullable(),
    due_day: z.number().int().min(1, "Dia inválido.").max(31, "Dia inválido."),
    recurrence: z.enum(["monthly", "weekly", "yearly", "biweekly", "custom"]),
    start_date: z.string().min(1, "Informe a data inicial."),
    end_date: z.string().nullable(),
    auto_pay: z.boolean(),
    account_id: z.string().nullable(),
    is_active: z.boolean(),
  })
  .refine((value) => !value.end_date || value.end_date >= value.start_date, {
    path: ["end_date"],
    message: "A data final deve ser posterior ao início.",
  });

type RecurringExpenseValues = z.infer<typeof recurringExpenseSchema>;

type DialogState =
  | { mode: "create"; expense?: undefined }
  | { mode: "edit"; expense: RecurringExpense };

const defaultValues: RecurringExpenseValues = {
  name: "",
  amount_cents: 0,
  category_id: null,
  due_day: 1,
  recurrence: "monthly",
  start_date: "",
  end_date: null,
  auto_pay: false,
  account_id: null,
  is_active: true,
};

export default function FixedExpensesPage() {
  const {
    accounts,
    categories,
    recurringExpenses,
    selectedMonth,
    transactions,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
  } = useFinance();
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringExpense | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );
  const monthlyIncome = sumByType(transactions, "income", selectedMonth);
  const summary = fixedExpensesSummary(
    recurringExpenses,
    transactions,
    selectedMonth,
    monthlyIncome
  );
  const activeExpenses = recurringExpenses.filter((expense) => expense.is_active);

  function handleSubmit(values: RecurringExpenseValues) {
    const payload = {
      name: values.name.trim(),
      amount_cents: values.amount_cents,
      category_id: values.category_id,
      due_day: values.due_day,
      recurrence: values.recurrence,
      start_date: values.start_date,
      end_date: values.end_date,
      auto_pay: values.auto_pay,
      account_id: values.account_id,
      is_active: values.is_active,
    };

    if (dialogState?.mode === "edit") {
      updateRecurringExpense(dialogState.expense.id, payload);
      toast.success("Gasto fixo atualizado.");
    } else {
      addRecurringExpense(payload);
      toast.success("Gasto fixo criado.");
    }
    setDialogState(null);
  }

  function handleDelete(expense: RecurringExpense) {
    deleteRecurringExpense(expense.id);
    setDeleteTarget(null);
    toast.success("Gasto fixo excluído.");
  }

  function toggleActive(expense: RecurringExpense) {
    updateRecurringExpense(expense.id, { is_active: !expense.is_active });
    toast.success(expense.is_active ? "Gasto fixo pausado." : "Gasto fixo reativado.");
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cyan)]">
            Gastos fixos
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--foreground)]">
            Despesas recorrentes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Controle aluguel, contas, mensalidades e compromissos que se repetem no orçamento.
          </p>
        </div>
        <Button type="button" onClick={() => setDialogState({ mode: "create" })}>
          <Plus className="size-4" />
          Novo gasto fixo
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total mensal"
          value={formatCurrency(summary.total)}
          description={`${summary.count} gastos ativos`}
        />
        <MetricCard
          title="% da renda"
          value={formatPercent(summary.incomeShare)}
          description={`${formatCurrency(monthlyIncome)} de receitas no mês`}
        />
        <MetricCard
          title="Pendente no mês"
          value={formatCurrency(summary.pending)}
          description={`${formatCurrency(summary.paid)} já conciliado`}
        />
      </section>

      {recurringExpenses.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Nenhum gasto fixo cadastrado"
          description="Cadastre despesas recorrentes para acompanhar vencimentos e impacto mensal."
          action={
            <Button type="button" onClick={() => setDialogState({ mode: "create" })}>
              <Plus className="size-4" />
              Novo gasto fixo
            </Button>
          }
        />
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {recurringExpenses
            .slice()
            .sort((a, b) => a.due_day - b.due_day)
            .map((expense) => {
              const category = expense.category_id
                ? categoryMap.get(expense.category_id)
                : undefined;
              const account = expense.account_id ? accountMap.get(expense.account_id) : undefined;
              return (
                <article
                  key={expense.id}
                  className={cn(
                    "glass-card p-5",
                    !expense.is_active && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[rgba(20,115,255,0.28)] bg-[rgba(20,115,255,0.12)] text-[var(--cyan)]">
                        <CalendarClock className="size-6" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-black text-[var(--foreground)]">
                          {expense.name}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {category?.name ?? "Sem categoria"} ·{" "}
                          {account?.name ?? "Sem conta"}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="size-9 rounded-xl">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Abrir ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => setDialogState({ mode: "edit", expense })}>
                          <Edit3 className="size-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toggleActive(expense)}>
                          <CheckCircle2 className="size-4" />
                          {expense.is_active ? "Pausar" : "Reativar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-[#ffc2ca]"
                          onSelect={() => setDeleteTarget(expense)}
                        >
                          <Trash2 className="size-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <Detail label="Valor" value={formatCurrency(expense.amount_cents)} />
                    <Detail label="Vencimento" value={`Dia ${expense.due_day}`} />
                    <Detail label="Recorrência" value={recurrenceLabels[expense.recurrence]} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.42)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                      Próxima ocorrência
                    </p>
                    <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                      {nextOccurrenceHint(expense)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {expense.auto_pay ? "Débito automático ativo" : "Pagamento manual"} ·{" "}
                      {expense.is_active ? "Ativo" : "Pausado"}
                    </p>
                  </div>
                </article>
              );
            })}
        </section>
      )}

      {activeExpenses.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Próximos vencimentos ativos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {activeExpenses
              .slice()
              .sort((a, b) => nextOccurrenceDate(a).localeCompare(nextOccurrenceDate(b)))
              .slice(0, 6)
              .map((expense) => (
                <div
                  key={expense.id}
                  className="rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.42)] p-4"
                >
                  <p className="font-bold text-[var(--foreground)]">{expense.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {formatDate(nextOccurrenceDate(expense))} · {formatCurrency(expense.amount_cents)}
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>
      ) : null}

      <RecurringExpenseDialog
        state={dialogState}
        categories={categories}
        accounts={accounts}
        onOpenChange={(open) => {
          if (!open) setDialogState(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Excluir gasto fixo?"
        description="Essa despesa recorrente será removida do painel demo."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
        }}
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-semibold text-[var(--muted)]">{title}</p>
        <p className="mt-2 text-2xl font-black text-[var(--foreground)]">{value}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.42)] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function RecurringExpenseDialog({
  state,
  categories,
  accounts,
  onOpenChange,
  onSubmit,
}: {
  state: DialogState | null;
  categories: Category[];
  accounts: Account[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RecurringExpenseValues) => void;
}) {
  const form = useForm<RecurringExpenseValues>({
    resolver: zodResolver(recurringExpenseSchema),
    values: state?.expense
      ? valuesFromRecurringExpense(state.expense)
      : { ...defaultValues, start_date: toISODate(nowInSaoPaulo()) },
  });
  const expenseCategories = categories.filter(
    (category) => !category.parent_id && (category.type === "expense" || category.type === "both")
  );

  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {state?.mode === "edit" ? "Editar gasto fixo" : "Novo gasto fixo"}
          </DialogTitle>
          <DialogDescription>
            Defina valor, vencimento, recorrência e conta de pagamento.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
            <Field label="Nome" error={form.formState.errors.name?.message}>
              <Input placeholder="Ex.: Aluguel, internet, energia" {...form.register("name")} />
            </Field>
            <Controller
              control={form.control}
              name="amount_cents"
              render={({ field }) => (
                <Field label="Valor" error={form.formState.errors.amount_cents?.message}>
                  <MoneyInput value={field.value} onValueChange={field.onChange} />
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Controller
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <Field label="Categoria">
                  <Select
                    value={field.value ?? NONE_VALUE}
                    onValueChange={(value) => field.onChange(value === NONE_VALUE ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Sem categoria</SelectItem>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Field label="Dia de vencimento" error={form.formState.errors.due_day?.message}>
              <Input type="number" min={1} max={31} {...form.register("due_day", { valueAsNumber: true })} />
            </Field>
            <Controller
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <Field label="Recorrência">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {recurrenceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Início" error={form.formState.errors.start_date?.message}>
              <Input type="date" {...form.register("start_date")} />
            </Field>
            <Controller
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <Field label="Fim" error={form.formState.errors.end_date?.message}>
                  <Input
                    type="date"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value || null)}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <Field label="Conta">
                  <Select
                    value={field.value ?? NONE_VALUE}
                    onValueChange={(value) => field.onChange(value === NONE_VALUE ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Conta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Sem conta</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="auto_pay"
              render={({ field }) => (
                <BooleanField
                  label="Débito automático"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <BooleanField
                  label="Ativo no orçamento"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {state?.mode === "edit" ? "Salvar alterações" : "Criar gasto fixo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs font-semibold text-[#ffc2ca]">{error}</p> : null}
    </div>
  );
}

function BooleanField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.72)] px-4 text-sm font-semibold text-[var(--foreground)]">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      {label}
    </label>
  );
}

function valuesFromRecurringExpense(expense: RecurringExpense): RecurringExpenseValues {
  return {
    name: expense.name,
    amount_cents: expense.amount_cents,
    category_id: expense.category_id,
    due_day: expense.due_day,
    recurrence: expense.recurrence,
    start_date: expense.start_date,
    end_date: expense.end_date,
    auto_pay: expense.auto_pay,
    account_id: expense.account_id,
    is_active: expense.is_active,
  };
}

function nextOccurrenceHint(expense: RecurringExpense): string {
  const date = nextOccurrenceDate(expense);
  return `${formatDate(date)} (${recurrenceLabels[expense.recurrence as Recurrence]})`;
}

function nextOccurrenceDate(expense: RecurringExpense): string {
  const today = nowInSaoPaulo();
  const current = dateFromDueDay(today.getFullYear(), today.getMonth(), expense.due_day);
  const todayIso = toISODate(today);
  if (current >= todayIso) return current;
  return dateFromDueDay(today.getFullYear(), today.getMonth() + 1, expense.due_day);
}

function dateFromDueDay(year: number, monthIndex: number, dueDay: number): string {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const date = new Date(year, monthIndex, Math.min(dueDay, lastDay));
  return toISODate(date);
}
