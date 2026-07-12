"use client";

import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit3,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  TrendingUp,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { goalOnTrack, totalSaved } from "@/lib/calculations";
import { formatDate, nowInSaoPaulo, toISODate } from "@/lib/date";
import { goalPriorityLabels, goalPriorityOptions } from "@/lib/labels";
import { formatCurrency, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useFinance } from "@/contexts/finance-context";
import type { Goal, GoalPriority } from "@/types/database";

const goalSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da meta."),
  targetAmountCents: z.number().int().positive("Informe um alvo maior que zero."),
  currentAmountCents: z.number().int().min(0, "O valor atual não pode ser negativo."),
  targetDate: z.string().min(1, "Informe a data alvo."),
  monthlyContributionCents: z.number().int().min(0, "A contribuição não pode ser negativa."),
  priority: z.enum(["low", "medium", "high"]),
  icon: z.string().trim().min(2, "Informe o nome do ícone Lucide."),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal."),
});

const contributionSchema = z.object({
  amountCents: z.number().int().positive("Informe um aporte maior que zero."),
});

type GoalFormValues = z.infer<typeof goalSchema>;
type ContributionFormValues = z.infer<typeof contributionSchema>;

const defaultGoalValues: GoalFormValues = {
  name: "",
  targetAmountCents: 1000000,
  currentAmountCents: 0,
  targetDate: toISODate(nowInSaoPaulo()),
  monthlyContributionCents: 50000,
  priority: "medium",
  icon: "Target",
  color: "#14D990",
};

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useFinance();
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);

  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: defaultGoalValues,
  });
  const contributionForm = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: { amountCents: 10000 },
  });

  const savedTotal = totalSaved(goals);
  const targetTotal = goals.reduce((sum, goal) => sum + goal.target_amount_cents, 0);
  const monthlyPlan = goals.reduce(
    (sum, goal) => sum + goal.monthly_contribution_cents,
    0
  );
  const sortedGoals = [...goals].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      a.target_date.localeCompare(b.target_date)
    );
  });

  function openCreateDialog() {
    setEditingGoal(null);
    goalForm.reset(defaultGoalValues);
    setGoalDialogOpen(true);
  }

  function openEditDialog(goal: Goal) {
    setEditingGoal(goal);
    goalForm.reset({
      name: goal.name,
      targetAmountCents: goal.target_amount_cents,
      currentAmountCents: goal.current_amount_cents,
      targetDate: goal.target_date,
      monthlyContributionCents: goal.monthly_contribution_cents,
      priority: goal.priority,
      icon: goal.icon,
      color: goal.color,
    });
    setGoalDialogOpen(true);
  }

  function openContributionDialog(goal: Goal) {
    setContributionGoal(goal);
    contributionForm.reset({
      amountCents: goal.monthly_contribution_cents || 10000,
    });
    setContributionDialogOpen(true);
  }

  function onSubmitGoal(values: GoalFormValues) {
    const payload = {
      name: values.name,
      target_amount_cents: values.targetAmountCents,
      current_amount_cents: values.currentAmountCents,
      target_date: values.targetDate,
      monthly_contribution_cents: values.monthlyContributionCents,
      priority: values.priority as GoalPriority,
      icon: values.icon,
      color: values.color,
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, payload);
      toast.success("Meta atualizada", {
        description: `${values.name} foi salva.`,
      });
    } else {
      addGoal(payload);
      toast.success("Meta criada", {
        description: `${values.name} entrou no seu plano.`,
      });
    }

    setGoalDialogOpen(false);
  }

  function onSubmitContribution(values: ContributionFormValues) {
    if (!contributionGoal) return;

    updateGoal(contributionGoal.id, {
      current_amount_cents:
        contributionGoal.current_amount_cents + values.amountCents,
    });
    toast.success("Aporte registrado", {
      description: `${formatCurrency(values.amountCents)} adicionados em ${contributionGoal.name}.`,
    });
    setContributionDialogOpen(false);
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 rounded-[28px] border border-[var(--card-border)] bg-[rgba(8,13,36,0.55)] p-6 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cyan)]">
            Metas financeiras
          </p>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Objetivos e aportes
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Acompanhe progresso, prioridade e previsão de chegada com base na
              contribuição mensal planejada.
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Nova meta
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={PiggyBank} label="Guardado" value={formatCurrency(savedTotal)} />
        <SummaryCard icon={Target} label="Alvo total" value={formatCurrency(targetTotal)} />
        <SummaryCard
          icon={TrendingUp}
          label="Aporte mensal planejado"
          value={formatCurrency(monthlyPlan)}
        />
      </section>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta cadastrada"
          description="Crie uma meta com alvo, prazo, prioridade e contribuição mensal."
          action={<Button onClick={openCreateDialog}>Criar meta</Button>}
        />
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {sortedGoals.map((goal) => {
            const estimate = goalOnTrack(goal);
            const progressLevel = estimate.progress >= 1 ? "done" : estimate.onTrack ? "ok" : "risk";

            return (
              <Card key={goal.id} className="overflow-hidden">
                <div className="h-1.5 w-full" style={{ backgroundColor: goal.color }} />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="cyan">Ícone: {goal.icon}</Badge>
                        <Badge variant={priorityVariant(goal.priority)}>
                          {goalPriorityLabels[goal.priority]}
                        </Badge>
                      </div>
                      <CardTitle className="truncate">{goal.name}</CardTitle>
                      <CardDescription>
                        Meta para {formatDate(goal.target_date)}
                      </CardDescription>
                    </div>
                    <Badge variant={estimate.onTrack ? "success" : "warning"}>
                      {estimate.onTrack ? "No prazo" : "Requer ajuste"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[var(--muted)]">
                        {formatCurrency(goal.current_amount_cents)} de{" "}
                        {formatCurrency(goal.target_amount_cents)}
                      </span>
                      <span className={cn("font-black", progressTextClass(progressLevel))}>
                        {formatPercent(estimate.progress)}
                      </span>
                    </div>
                    <GoalProgressBar value={estimate.progress} level={progressLevel} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MiniMetric
                      label="Aporte mensal"
                      value={formatCurrency(goal.monthly_contribution_cents)}
                    />
                    <MiniMetric
                      label="Projetado"
                      value={formatCurrency(estimate.projectedCents)}
                    />
                    <MiniMetric
                      label="Meses restantes"
                      value={String(estimate.monthsRemaining)}
                    />
                    <MiniMetric
                      label="Restante"
                      value={formatCurrency(
                        Math.max(0, goal.target_amount_cents - goal.current_amount_cents)
                      )}
                    />
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="success"
                      size="sm"
                      onClick={() => openContributionDialog(goal)}
                    >
                      <Plus className="size-4" />
                      Aportar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditDialog(goal)}
                    >
                      <Edit3 className="size-4" />
                      Editar
                    </Button>
                    <ConfirmDialog
                      title="Excluir meta?"
                      description={`A meta ${goal.name} será removida do demo local.`}
                      confirmLabel="Excluir"
                      destructive
                      trigger={
                        <Button type="button" variant="danger" size="sm">
                          <Trash2 className="size-4" />
                          Excluir
                        </Button>
                      }
                      onConfirm={() => {
                        deleteGoal(goal.id);
                        toast.success("Meta excluída");
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Editar meta" : "Nova meta"}</DialogTitle>
            <DialogDescription>
              Configure alvo, progresso atual, prazo e identificação visual.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-5" onSubmit={goalForm.handleSubmit(onSubmitGoal)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nome" error={goalForm.formState.errors.name?.message}>
                <Input placeholder="Ex.: Reserva de emergência" {...goalForm.register("name")} />
              </FormField>
              <FormField label="Data alvo" error={goalForm.formState.errors.targetDate?.message}>
                <Input type="date" {...goalForm.register("targetDate")} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Controller
                control={goalForm.control}
                name="targetAmountCents"
                render={({ field }) => (
                  <FormField
                    label="Valor alvo"
                    error={goalForm.formState.errors.targetAmountCents?.message}
                  >
                    <MoneyInput value={field.value} onValueChange={field.onChange} />
                  </FormField>
                )}
              />
              <Controller
                control={goalForm.control}
                name="currentAmountCents"
                render={({ field }) => (
                  <FormField
                    label="Valor atual"
                    error={goalForm.formState.errors.currentAmountCents?.message}
                  >
                    <MoneyInput value={field.value} onValueChange={field.onChange} />
                  </FormField>
                )}
              />
              <Controller
                control={goalForm.control}
                name="monthlyContributionCents"
                render={({ field }) => (
                  <FormField
                    label="Aporte mensal"
                    error={goalForm.formState.errors.monthlyContributionCents?.message}
                  >
                    <MoneyInput value={field.value} onValueChange={field.onChange} />
                  </FormField>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Controller
                control={goalForm.control}
                name="priority"
                render={({ field }) => (
                  <FormField label="Prioridade">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {goalPriorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />
              <FormField
                label="Ícone Lucide (texto)"
                error={goalForm.formState.errors.icon?.message}
              >
                <Input placeholder="Ex.: Plane, Home, Car" {...goalForm.register("icon")} />
              </FormField>
              <FormField label="Cor" error={goalForm.formState.errors.color?.message}>
                <Input type="color" className="h-12 p-2" {...goalForm.register("color")} />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setGoalDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingGoal ? "Salvar meta" : "Criar meta"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={contributionDialogOpen} onOpenChange={setContributionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aportar em meta</DialogTitle>
            <DialogDescription>
              {contributionGoal
                ? `Atualize o valor guardado em ${contributionGoal.name}.`
                : "Selecione uma meta para aportar."}
            </DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-5"
            onSubmit={contributionForm.handleSubmit(onSubmitContribution)}
          >
            <Controller
              control={contributionForm.control}
              name="amountCents"
              render={({ field }) => (
                <FormField
                  label="Valor do aporte"
                  error={contributionForm.formState.errors.amountCents?.message}
                >
                  <MoneyInput value={field.value} onValueChange={field.onChange} />
                </FormField>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setContributionDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Registrar aporte</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function priorityVariant(priority: GoalPriority): "danger" | "warning" | "muted" {
  if (priority === "high") return "danger";
  if (priority === "medium") return "warning";
  return "muted";
}

function progressTextClass(level: "done" | "ok" | "risk") {
  if (level === "done" || level === "ok") return "text-[#a8f7d8]";
  return "text-[#fde3a3]";
}

function GoalProgressBar({
  value,
  level,
}: {
  value: number;
  level: "done" | "ok" | "risk";
}) {
  const colors = {
    done: "from-[#14D990] to-[#A7F3D0]",
    ok: "from-[var(--primary)] to-[var(--cyan)]",
    risk: "from-[#F59E0B] to-[#FDE68A]",
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
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-[rgba(20,217,144,0.28)] bg-[rgba(20,217,144,0.12)] text-[#a8f7d8]">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
          <p className="text-2xl font-black text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
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
