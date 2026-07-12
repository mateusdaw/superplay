"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit3,
  PieChart,
  Plus,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoneyInput } from "@/components/shared/money-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinance } from "@/contexts/finance-context";
import { budgetProgress } from "@/lib/calculations";
import { formatMonthYear } from "@/lib/date";
import { formatCurrency, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Budget } from "@/types/database";

const NONE_VALUE = "none";

const budgetSchema = z.object({
  categoryId: z.string().refine((value) => value !== NONE_VALUE, {
    message: "Selecione uma categoria.",
  }),
  limitCents: z.number().int().positive("Informe um limite maior que zero."),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

const defaultValues: BudgetFormValues = {
  categoryId: NONE_VALUE,
  limitCents: 100000,
};

export default function BudgetsPage() {
  const {
    budgets,
    categories,
    transactions,
    selectedMonth,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues,
  });

  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.type === "expense" || category.type === "both"
      ),
    [categories]
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const monthBudgets = budgets.filter((budget) => budget.month === selectedMonth);
  const budgetRows = monthBudgets
    .map((budget) => ({
      budget,
      category: categoryMap.get(budget.category_id),
      progress: budgetProgress(budget, transactions),
    }))
    .sort((a, b) => b.progress.usageRatio - a.progress.usageRatio);

  const usedCategoryIds = new Set(monthBudgets.map((budget) => budget.category_id));
  const availableCategories = expenseCategories.filter(
    (category) =>
      !usedCategoryIds.has(category.id) || category.id === editingBudget?.category_id
  );
  const totalLimit = budgetRows.reduce((sum, row) => sum + row.budget.limit_cents, 0);
  const totalSpent = budgetRows.reduce((sum, row) => sum + row.progress.spentCents, 0);
  const totalRemaining = totalLimit - totalSpent;

  function openCreateDialog() {
    setEditingBudget(null);
    const firstCategory = expenseCategories.find(
      (category) => !usedCategoryIds.has(category.id)
    );
    form.reset({
      categoryId: firstCategory?.id ?? NONE_VALUE,
      limitCents: 100000,
    });
    setDialogOpen(true);
  }

  function openEditDialog(budget: Budget) {
    setEditingBudget(budget);
    form.reset({
      categoryId: budget.category_id,
      limitCents: budget.limit_cents,
    });
    setDialogOpen(true);
  }

  function onSubmit(values: BudgetFormValues) {
    const duplicate = monthBudgets.find(
      (budget) =>
        budget.category_id === values.categoryId && budget.id !== editingBudget?.id
    );

    if (duplicate) {
      updateBudget(duplicate.id, { limit_cents: values.limitCents });
      toast.success("Orçamento atualizado", {
        description: "Já existia um limite para esta categoria no mês selecionado.",
      });
      setDialogOpen(false);
      return;
    }

    if (editingBudget) {
      updateBudget(editingBudget.id, {
        category_id: values.categoryId,
        limit_cents: values.limitCents,
      });
      toast.success("Orçamento atualizado");
    } else {
      addBudget({
        category_id: values.categoryId,
        month: selectedMonth,
        limit_cents: values.limitCents,
      });
      toast.success("Orçamento criado", {
        description: "O limite passa a valer para o mês selecionado.",
      });
    }

    setDialogOpen(false);
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 rounded-[28px] border border-[var(--card-border)] bg-[rgba(8,13,36,0.55)] p-6 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cyan)]">
            Orçamentos · {formatMonthYear(`${selectedMonth}-01`)}
          </p>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Limites por categoria
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Defina limites mensais e acompanhe quando os gastos cruzam 80% ou
              estouram 100% do orçamento.
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog} disabled={availableCategories.length === 0}>
          <Plus className="size-4" />
          Novo orçamento
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={PieChart} label="Limite mensal" value={formatCurrency(totalLimit)} />
        <SummaryCard icon={Wallet} label="Gasto até agora" value={formatCurrency(totalSpent)} />
        <SummaryCard
          icon={Wallet}
          label="Restante"
          value={formatCurrency(totalRemaining)}
          tone={totalRemaining < 0 ? "danger" : "default"}
        />
      </section>

      {budgetRows.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="Nenhum orçamento neste mês"
          description="Crie limites por categoria para acompanhar o progresso do mês selecionado."
          action={
            <Button onClick={openCreateDialog} disabled={expenseCategories.length === 0}>
              Criar orçamento
            </Button>
          }
        />
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {budgetRows.map(({ budget, category, progress }) => (
            <Card key={budget.id} className="overflow-hidden">
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: category?.color ?? "#64748B" }}
              />
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">
                      {category?.name ?? "Categoria removida"}
                    </CardTitle>
                    <CardDescription>
                      {formatCurrency(progress.spentCents)} de{" "}
                      {formatCurrency(budget.limit_cents)}
                    </CardDescription>
                  </div>
                  <Badge variant={badgeForLevel(progress.level)}>
                    {labelForLevel(progress.level)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--muted)]">Progresso</span>
                    <span className={cn("font-black", textForLevel(progress.level))}>
                      {formatPercent(progress.usageRatio)}
                    </span>
                  </div>
                  <BudgetProgressBar value={progress.usageRatio} level={progress.level} />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniMetric label="Limite" value={formatCurrency(budget.limit_cents)} />
                  <MiniMetric label="Gasto" value={formatCurrency(progress.spentCents)} />
                  <MiniMetric
                    label="Restante"
                    value={formatCurrency(progress.remainingCents)}
                    danger={progress.remainingCents < 0}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditDialog(budget)}
                  >
                    <Edit3 className="size-4" />
                    Editar limite
                  </Button>
                  <ConfirmDialog
                    title="Excluir orçamento?"
                    description={`Remover limite de ${category?.name ?? "categoria"} para ${formatMonthYear(`${selectedMonth}-01`)}.`}
                    confirmLabel="Excluir"
                    destructive
                    trigger={
                      <Button type="button" variant="danger" size="sm">
                        <Trash2 className="size-4" />
                        Excluir
                      </Button>
                    }
                    onConfirm={() => {
                      deleteBudget(budget.id);
                      toast.success("Orçamento excluído");
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? "Editar orçamento" : "Novo orçamento"}
            </DialogTitle>
            <DialogDescription>
              O limite será aplicado a {formatMonthYear(`${selectedMonth}-01`)}.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormField
                  label="Categoria"
                  error={form.formState.errors.categoryId?.message}
                >
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.length === 0 ? (
                        <SelectItem value={NONE_VALUE} disabled>
                          Sem categorias disponíveis
                        </SelectItem>
                      ) : null}
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />

            <Controller
              control={form.control}
              name="limitCents"
              render={({ field }) => (
                <FormField label="Limite mensal" error={form.formState.errors.limitCents?.message}>
                  <MoneyInput value={field.value} onValueChange={field.onChange} />
                </FormField>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingBudget ? "Salvar limite" : "Criar orçamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function badgeForLevel(level: "ok" | "warning" | "critical"):
  | "success"
  | "warning"
  | "danger" {
  if (level === "critical") return "danger";
  if (level === "warning") return "warning";
  return "success";
}

function labelForLevel(level: "ok" | "warning" | "critical") {
  if (level === "critical") return "Estourado";
  if (level === "warning") return "Atenção";
  return "No plano";
}

function textForLevel(level: "ok" | "warning" | "critical") {
  if (level === "critical") return "text-[#ffc2ca]";
  if (level === "warning") return "text-[#fde3a3]";
  return "text-[#a8f7d8]";
}

function BudgetProgressBar({
  value,
  level,
}: {
  value: number;
  level: "ok" | "warning" | "critical";
}) {
  const colors = {
    ok: "from-[var(--primary)] to-[var(--cyan)]",
    warning: "from-[#F59E0B] to-[#FDE68A]",
    critical: "from-[#FF5A6F] to-[#FB7185]",
  };

  return (
    <div className="h-3 overflow-hidden rounded-full bg-[rgba(148,163,184,0.14)]">
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all", colors[level])}
        style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }}
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-[rgba(20,115,255,0.28)] bg-[rgba(20,115,255,0.12)] text-[var(--cyan)]">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
          <p
            className={cn(
              "text-2xl font-black text-white",
              tone === "danger" && "text-[#ffc2ca]"
            )}
          >
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function MiniMetric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </p>
      <p className={cn("mt-1 text-sm font-black text-white", danger && "text-[#ffc2ca]")}>
        {value}
      </p>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs font-semibold text-[#ffc2ca]">{error}</p> : null}
    </div>
  );
}
