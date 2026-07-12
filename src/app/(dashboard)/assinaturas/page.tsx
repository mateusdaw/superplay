"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, CalendarClock, Edit3, Plus, Repeat, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useFinance } from "@/contexts/finance-context";
import { formatDate, formatRelativeDue, nowInSaoPaulo, toISODate } from "@/lib/date";
import { recurrenceLabels, recurrenceOptions } from "@/lib/labels";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Recurrence, Subscription } from "@/types/database";

const NONE_VALUE = "none";

const subscriptionSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da assinatura."),
  amountCents: z.number().int().positive("Informe um valor maior que zero."),
  categoryId: z.string(),
  billingDay: z.number().int().min(1).max(31),
  recurrence: z.enum(["monthly", "weekly", "yearly", "biweekly", "custom"]),
  nextBillingDate: z.string().min(1, "Informe a próxima cobrança."),
  accountId: z.string(),
  isActive: z.boolean(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

const defaultValues: SubscriptionFormValues = {
  name: "",
  amountCents: 4990,
  categoryId: NONE_VALUE,
  billingDay: 10,
  recurrence: "monthly",
  nextBillingDate: toISODate(nowInSaoPaulo()),
  accountId: NONE_VALUE,
  isActive: true,
};

export default function SubscriptionsPage() {
  const {
    accounts,
    categories,
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues,
  });

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.is_active);
  const monthlyTotal = activeSubscriptions.reduce(
    (sum, subscription) => sum + monthlyEquivalent(subscription.amount_cents, subscription.recurrence),
    0
  );
  const upcomingRenewals = [...activeSubscriptions]
    .sort((a, b) => a.next_billing_date.localeCompare(b.next_billing_date))
    .slice(0, 6);

  function openCreateDialog() {
    setEditingSubscription(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  }

  function openEditDialog(subscription: Subscription) {
    setEditingSubscription(subscription);
    form.reset({
      name: subscription.name,
      amountCents: subscription.amount_cents,
      categoryId: subscription.category_id ?? NONE_VALUE,
      billingDay: subscription.billing_day,
      recurrence: subscription.recurrence,
      nextBillingDate: subscription.next_billing_date,
      accountId: subscription.account_id ?? NONE_VALUE,
      isActive: subscription.is_active,
    });
    setDialogOpen(true);
  }

  function onSubmit(values: SubscriptionFormValues) {
    const payload = {
      name: values.name,
      amount_cents: values.amountCents,
      category_id: values.categoryId === NONE_VALUE ? null : values.categoryId,
      billing_day: values.billingDay,
      recurrence: values.recurrence as Recurrence,
      next_billing_date: values.nextBillingDate,
      account_id: values.accountId === NONE_VALUE ? null : values.accountId,
      is_active: values.isActive,
    };

    if (editingSubscription) {
      updateSubscription(editingSubscription.id, payload);
      toast.success("Assinatura atualizada", {
        description: `${values.name} foi salva.`,
      });
    } else {
      addSubscription(payload);
      toast.success("Assinatura criada", {
        description: `${values.name} entrou nos recorrentes.`,
      });
    }

    setDialogOpen(false);
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 rounded-[28px] border border-[var(--card-border)] bg-[rgba(8,13,36,0.55)] p-6 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cyan)]">
            Assinaturas
          </p>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Serviços recorrentes
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Acompanhe valores, periodicidade e próximas renovações de streaming,
              softwares, clubes e outros serviços.
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Nova assinatura
        </Button>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-[rgba(236,72,153,0.32)] bg-[rgba(236,72,153,0.12)] text-[#f9a8d4]">
              <Repeat className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">
                Total mensal ativo
              </p>
              <p className="text-3xl font-black text-white">
                {formatCurrency(monthlyTotal)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Valores semanais, quinzenais e anuais são convertidos para uma média mensal.
          </p>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-5 text-[var(--cyan)]" />
              <CardTitle>Próximas renovações</CardTitle>
            </div>
            <CardDescription>Assinaturas ativas por data de cobrança.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingRenewals.map((subscription) => (
              <div
                key={subscription.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{subscription.name}</p>
                  <p className="text-xs font-semibold text-[var(--muted)]">
                    {formatDate(subscription.next_billing_date)} ·{" "}
                    {formatRelativeDue(subscription.next_billing_date)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-black text-white">
                  {formatCurrency(subscription.amount_cents)}
                </p>
              </div>
            ))}
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Nenhuma renovação ativa.</p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nenhuma assinatura cadastrada"
          description="Adicione seus serviços recorrentes para visualizar o impacto mensal."
          action={<Button onClick={openCreateDialog}>Adicionar assinatura</Button>}
        />
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {subscriptions.map((subscription) => {
            const category = subscription.category_id
              ? categoryMap.get(subscription.category_id)
              : null;
            const account = subscription.account_id
              ? accountMap.get(subscription.account_id)
              : null;

            return (
              <Card key={subscription.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{subscription.name}</CardTitle>
                      <CardDescription>
                        {recurrenceLabels[subscription.recurrence]} · dia{" "}
                        {subscription.billing_day}
                      </CardDescription>
                    </div>
                    <Badge variant={subscription.is_active ? "success" : "muted"}>
                      {subscription.is_active ? "Ativa" : "Pausada"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--muted)]">Valor</p>
                      <p className="mt-1 text-3xl font-black text-white">
                        {formatCurrency(subscription.amount_cents)}
                      </p>
                    </div>
                    <Badge variant="cyan">
                      {formatCurrency(
                        monthlyEquivalent(subscription.amount_cents, subscription.recurrence)
                      )}
                      /mês
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoBlock
                      label="Próxima cobrança"
                      value={formatDate(subscription.next_billing_date)}
                    />
                    <InfoBlock
                      label="Status"
                      value={formatRelativeDue(subscription.next_billing_date)}
                      tone={
                        subscription.next_billing_date < toISODate(nowInSaoPaulo())
                          ? "danger"
                          : "default"
                      }
                    />
                    <InfoBlock label="Categoria" value={category?.name ?? "Sem categoria"} />
                    <InfoBlock label="Conta" value={account?.name ?? "Sem conta"} />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-white">Assinatura ativa</p>
                      <p className="text-xs text-[var(--muted)]">Entra no total mensal</p>
                    </div>
                    <Switch
                      checked={subscription.is_active}
                      onCheckedChange={(checked) => {
                        updateSubscription(subscription.id, { is_active: checked });
                        toast.success(checked ? "Assinatura ativada" : "Assinatura pausada");
                      }}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditDialog(subscription)}
                    >
                      <Edit3 className="size-4" />
                      Editar
                    </Button>
                    <ConfirmDialog
                      title="Excluir assinatura?"
                      description={`A assinatura ${subscription.name} será removida.`}
                      confirmLabel="Excluir"
                      destructive
                      trigger={
                        <Button type="button" variant="danger" size="sm">
                          <Trash2 className="size-4" />
                          Excluir
                        </Button>
                      }
                      onConfirm={() => {
                        deleteSubscription(subscription.id);
                        toast.success("Assinatura excluída");
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSubscription ? "Editar assinatura" : "Nova assinatura"}
            </DialogTitle>
            <DialogDescription>
              Defina valor, recorrência e próxima data de cobrança.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nome" error={form.formState.errors.name?.message}>
                <Input placeholder="Ex.: Netflix, Spotify, iCloud" {...form.register("name")} />
              </FormField>
              <Controller
                control={form.control}
                name="amountCents"
                render={({ field }) => (
                  <FormField label="Valor" error={form.formState.errors.amountCents?.message}>
                    <MoneyInput value={field.value} onValueChange={field.onChange} />
                  </FormField>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Controller
                control={form.control}
                name="recurrence"
                render={({ field }) => (
                  <FormField label="Recorrência">
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
                  </FormField>
                )}
              />
              <FormField
                label="Dia de cobrança"
                error={form.formState.errors.billingDay?.message}
              >
                <Input
                  type="number"
                  min={1}
                  max={31}
                  {...form.register("billingDay", { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Próxima cobrança"
                error={form.formState.errors.nextBillingDate?.message}
              >
                <Input type="date" {...form.register("nextBillingDate")} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormField label="Categoria">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>Sem categoria</SelectItem>
                        {categories
                          .filter(
                            (category) =>
                              category.type === "expense" || category.type === "both"
                          )
                          .map((category) => (
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
                name="accountId"
                render={({ field }) => (
                  <FormField label="Conta">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar conta" />
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
                  </FormField>
                )}
              />
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.72)] px-4 py-3">
                    <div>
                      <Label>Ativa</Label>
                      <p className="text-xs text-[var(--muted)]">Inclui nos totais</p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingSubscription ? "Salvar assinatura" : "Criar assinatura"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function monthlyEquivalent(amountCents: number, recurrence: Recurrence): number {
  switch (recurrence) {
    case "weekly":
      return Math.round((amountCents * 52) / 12);
    case "biweekly":
      return Math.round((amountCents * 26) / 12);
    case "yearly":
      return Math.round(amountCents / 12);
    case "monthly":
    case "custom":
    default:
      return amountCents;
  }
}

function InfoBlock({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-black text-white",
          tone === "danger" && "text-[#ffc2ca]"
        )}
      >
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
