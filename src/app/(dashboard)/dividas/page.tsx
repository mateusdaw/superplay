"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calculator,
  Edit3,
  Landmark,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { DebtCard } from "@/components/dashboard/debt-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoneyInput } from "@/components/shared/money-input";
import { useFinance } from "@/contexts/finance-context";
import {
  debtProgress,
  debtToIncomeRatio,
  estimatedPayoff,
  monthlyDebtCommitment,
  remainingInstallments,
  simulateEarlyPayoff,
  sumByType,
  totalDebtBalance,
} from "@/lib/calculations";
import { formatDate, nowInSaoPaulo, toISODate } from "@/lib/date";
import { debtStatusLabels, debtStatusOptions } from "@/lib/labels";
import { formatCurrency, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  debtDefaultValues,
  debtFormSchema,
  type DebtFormValues,
} from "@/lib/validations/debt";
import type { Debt } from "@/types/database";

type DialogState = { mode: "create"; debt?: undefined } | { mode: "edit"; debt: Debt };

export default function DebtsPage() {
  const {
    debts,
    selectedMonth,
    transactions,
    addDebt,
    updateDebt,
    deleteDebt,
  } = useFinance();
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  const [extraMonthlyCents, setExtraMonthlyCents] = useState(0);
  const [simulatedDebtId, setSimulatedDebtId] = useState<string | undefined>(
    () => debts.find((debt) => debt.status === "active" || debt.status === "overdue")?.id
  );

  const activeDebts = debts.filter(
    (debt) => debt.status === "active" || debt.status === "overdue"
  );
  const totalDebt = totalDebtBalance(debts);
  const commitment = monthlyDebtCommitment(debts);
  const monthlyIncome = sumByType(transactions, "income", selectedMonth);
  const dti = debtToIncomeRatio(commitment, monthlyIncome);
  const simulatedDebt =
    activeDebts.find((debt) => debt.id === simulatedDebtId) ?? activeDebts[0] ?? debts[0];
  const simulation = simulatedDebt
    ? simulateEarlyPayoff(simulatedDebt, extraMonthlyCents)
    : null;

  const sortedDebts = useMemo(
    () =>
      debts
        .slice()
        .sort((a, b) => {
          const statusWeight = (debt: Debt) =>
            debt.status === "overdue" ? 0 : debt.status === "active" ? 1 : 2;
          return statusWeight(a) - statusWeight(b) || b.current_balance_cents - a.current_balance_cents;
        }),
    [debts]
  );

  function handleSubmit(values: DebtFormValues) {
    const payload = {
      name: values.name.trim(),
      creditor: values.creditor.trim(),
      original_amount_cents: values.original_amount_cents,
      current_balance_cents: values.current_balance_cents,
      interest_rate_annual: values.interest_rate_annual,
      installment_amount_cents: values.installment_amount_cents,
      total_installments: values.total_installments,
      paid_installments: values.paid_installments,
      due_day: values.due_day,
      start_date: values.start_date,
      notes: values.notes?.trim() ? values.notes.trim() : null,
      status: values.status,
    };

    if (dialogState?.mode === "edit") {
      updateDebt(dialogState.debt.id, payload);
      toast.success("Dívida atualizada.");
    } else {
      const created = addDebt(payload);
      setSimulatedDebtId(created.id);
      toast.success("Dívida criada.");
    }
    setDialogState(null);
  }

  function handleDelete(debt: Debt) {
    deleteDebt(debt.id);
    if (simulatedDebtId === debt.id) setSimulatedDebtId(undefined);
    setDeleteTarget(null);
    toast.success("Dívida excluída.");
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cyan)]">
            Dívidas
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--foreground)]">
            Plano de quitação
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Acompanhe saldo, parcelas, DTI e cenários de amortização antecipada.
          </p>
        </div>
        <Button type="button" onClick={() => setDialogState({ mode: "create" })}>
          <Plus className="size-4" />
          Nova dívida
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Dívida total"
          value={formatCurrency(totalDebt)}
          description={`${activeDebts.length} contratos ativos ou atrasados`}
        />
        <MetricCard
          title="Compromisso mensal"
          value={formatCurrency(commitment)}
          description="Soma das parcelas ativas"
        />
        <MetricCard
          title="DTI"
          value={formatPercent(dti)}
          description={`${formatCurrency(monthlyIncome)} de renda no mês`}
          tone={dti > 0.35 ? "danger" : dti > 0.25 ? "warning" : "default"}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="size-5 text-[var(--cyan)]" />
            Simulador de quitação antecipada
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4">
            <Field label="Dívida">
              <Select
                value={simulatedDebt?.id ?? ""}
                onValueChange={setSimulatedDebtId}
                disabled={!simulatedDebt}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma dívida" />
                </SelectTrigger>
                <SelectContent>
                  {activeDebts.map((debt) => (
                    <SelectItem key={debt.id} value={debt.id}>
                      {debt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Valor extra mensal">
              <MoneyInput value={extraMonthlyCents} onValueChange={setExtraMonthlyCents} />
            </Field>
          </div>

          {simulatedDebt && simulation ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Detail label="Meses economizados" value={`${simulation.monthsSaved} meses`} />
              <Detail
                label="Juros economizados"
                value={formatCurrency(simulation.interestSavedCents)}
              />
              <Detail label="Novo prazo" value={`${simulation.newPayoffMonths} meses`} />
              <div className="rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.42)] p-4 sm:col-span-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--foreground)]">
                      {simulatedDebt.name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Quitação estimada atual: {formatDate(estimatedPayoff(simulatedDebt))}
                    </p>
                  </div>
                  <span className="text-sm font-black text-[var(--foreground)]">
                    {formatPercent(debtProgress(simulatedDebt))}
                  </span>
                </div>
                <Progress className="mt-3" value={Math.round(debtProgress(simulatedDebt) * 100)} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-6 text-sm text-[var(--muted)]">
              Cadastre uma dívida ativa para simular amortizações.
            </div>
          )}
        </CardContent>
      </Card>

      {debts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhuma dívida cadastrada"
          description="Adicione financiamentos, empréstimos ou parcelamentos para acompanhar o plano de quitação."
          action={
            <Button type="button" onClick={() => setDialogState({ mode: "create" })}>
              <Plus className="size-4" />
              Nova dívida
            </Button>
          }
        />
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {sortedDebts.map((debt) => (
            <div key={debt.id} className="space-y-3">
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <MoreHorizontal className="size-4" />
                      Ações
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{debt.name}</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => setDialogState({ mode: "edit", debt })}>
                      <Edit3 className="size-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-[#ffc2ca]" onSelect={() => setDeleteTarget(debt)}>
                      <Trash2 className="size-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <DebtCard debt={debt} />
              <div className="grid gap-3 rounded-3xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.45)] p-4 sm:grid-cols-3">
                <Detail label="Progresso" value={formatPercent(debtProgress(debt))} />
                <Detail
                  label="Quitação estimada"
                  value={formatDate(estimatedPayoff(debt))}
                />
                <Detail
                  label="Parcelas restantes"
                  value={`${remainingInstallments(debt)} meses`}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      <DebtDialog
        state={dialogState}
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
        title="Excluir dívida?"
        description="O contrato será removido do painel demo."
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
  tone = "default",
}: {
  title: string;
  value: string;
  description: string;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <Card
      className={cn(
        tone === "warning" && "border-[rgba(245,158,11,0.34)]",
        tone === "danger" && "border-[rgba(255,90,111,0.34)]"
      )}
    >
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

function DebtDialog({
  state,
  onOpenChange,
  onSubmit,
}: {
  state: DialogState | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DebtFormValues) => void;
}) {
  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtFormSchema),
    values: state?.debt
      ? valuesFromDebt(state.debt)
      : { ...debtDefaultValues, start_date: toISODate(nowInSaoPaulo()) },
  });

  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{state?.mode === "edit" ? "Editar dívida" : "Nova dívida"}</DialogTitle>
          <DialogDescription>
            Registre saldo, taxa, parcelas e vencimento do contrato.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome" error={form.formState.errors.name?.message}>
              <Input placeholder="Ex.: Financiamento carro" {...form.register("name")} />
            </Field>
            <Field label="Credor" error={form.formState.errors.creditor?.message}>
              <Input placeholder="Ex.: Banco, financeira, pessoa" {...form.register("creditor")} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Controller
              control={form.control}
              name="original_amount_cents"
              render={({ field }) => (
                <Field label="Valor original" error={form.formState.errors.original_amount_cents?.message}>
                  <MoneyInput value={field.value} onValueChange={field.onChange} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="current_balance_cents"
              render={({ field }) => (
                <Field label="Saldo atual" error={form.formState.errors.current_balance_cents?.message}>
                  <MoneyInput value={field.value} onValueChange={field.onChange} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="installment_amount_cents"
              render={({ field }) => (
                <Field label="Parcela" error={form.formState.errors.installment_amount_cents?.message}>
                  <MoneyInput value={field.value} onValueChange={field.onChange} />
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Juros a.a. (%)" error={form.formState.errors.interest_rate_annual?.message}>
              <Input
                type="number"
                min={0}
                step="0.01"
                {...form.register("interest_rate_annual", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Total parcelas" error={form.formState.errors.total_installments?.message}>
              <Input
                type="number"
                min={1}
                {...form.register("total_installments", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Parcelas pagas" error={form.formState.errors.paid_installments?.message}>
              <Input
                type="number"
                min={0}
                {...form.register("paid_installments", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Dia venc." error={form.formState.errors.due_day?.message}>
              <Input type="number" min={1} max={31} {...form.register("due_day", { valueAsNumber: true })} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Início" error={form.formState.errors.start_date?.message}>
              <Input type="date" {...form.register("start_date")} />
            </Field>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Field label="Status">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {debtStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {debtStatusLabels[option.value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="notes"
            render={({ field }) => (
              <Field label="Observações">
                <Textarea
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value || null)}
                  placeholder="Contrato, renegociação, garantia..."
                />
              </Field>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {state?.mode === "edit" ? "Salvar alterações" : "Criar dívida"}
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

function valuesFromDebt(debt: Debt): DebtFormValues {
  return {
    name: debt.name,
    creditor: debt.creditor,
    original_amount_cents: debt.original_amount_cents,
    current_balance_cents: debt.current_balance_cents,
    interest_rate_annual: debt.interest_rate_annual,
    installment_amount_cents: debt.installment_amount_cents,
    total_installments: debt.total_installments,
    paid_installments: debt.paid_installments,
    due_day: debt.due_day,
    start_date: debt.start_date,
    notes: debt.notes,
    status: debt.status,
  };
}
