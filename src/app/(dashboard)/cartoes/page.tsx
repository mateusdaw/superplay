"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreditCard,
  Edit3,
  Plus,
  ReceiptText,
  ShieldCheck,
  Trash2,
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
import { Switch } from "@/components/ui/switch";
import { useFinance } from "@/contexts/finance-context";
import { cardUsage } from "@/lib/calculations";
import { getMonthRange, formatMonthYear } from "@/lib/date";
import { cardBrandLabels, cardBrandOptions } from "@/lib/labels";
import { formatCurrency, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CardBrand, CreditCard as CreditCardModel, Transaction } from "@/types/database";

const cardSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome do cartão."),
    bank: z.string().trim().min(2, "Informe o banco emissor."),
    brand: z.enum(["visa", "mastercard", "elo", "amex", "hipercard", "other"]),
    creditLimitCents: z.number().int().positive("Informe um limite maior que zero."),
    availableLimitCents: z.number().int().min(0, "O limite disponível não pode ser negativo."),
    closingDay: z.number().int().min(1).max(31),
    dueDay: z.number().int().min(1).max(31),
    color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal."),
    lastFour: z
      .string()
      .trim()
      .max(4, "Informe no máximo 4 dígitos.")
      .regex(/^\d{0,4}$/, "Use apenas dígitos."),
    isActive: z.boolean(),
  })
  .refine((values) => values.availableLimitCents <= values.creditLimitCents, {
    path: ["availableLimitCents"],
    message: "O disponível não pode ser maior que o limite.",
  });

type CardFormValues = z.infer<typeof cardSchema>;

const defaultValues: CardFormValues = {
  name: "",
  bank: "",
  brand: "mastercard",
  creditLimitCents: 500000,
  availableLimitCents: 500000,
  closingDay: 20,
  dueDay: 5,
  color: "#1473FF",
  lastFour: "",
  isActive: true,
};

export default function CardsPage() {
  const {
    creditCards,
    transactions,
    selectedMonth,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
  } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardModel | null>(null);

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues,
  });

  const invoiceByCard = useMemo(
    () => buildInvoiceSummaries(transactions, selectedMonth),
    [selectedMonth, transactions]
  );

  const activeCards = creditCards.filter((card) => card.is_active);
  const totalLimit = activeCards.reduce((sum, card) => sum + card.credit_limit_cents, 0);
  const totalAvailable = activeCards.reduce(
    (sum, card) => sum + card.available_limit_cents,
    0
  );
  const totalUsed = totalLimit - totalAvailable;

  function openCreateDialog() {
    setEditingCard(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  }

  function openEditDialog(card: CreditCardModel) {
    setEditingCard(card);
    form.reset({
      name: card.name,
      bank: card.bank,
      brand: card.brand,
      creditLimitCents: card.credit_limit_cents,
      availableLimitCents: card.available_limit_cents,
      closingDay: card.closing_day,
      dueDay: card.due_day,
      color: card.color,
      lastFour: card.last_four,
      isActive: card.is_active,
    });
    setDialogOpen(true);
  }

  function onSubmit(values: CardFormValues) {
    const payload = {
      name: values.name,
      bank: values.bank,
      brand: values.brand as CardBrand,
      credit_limit_cents: values.creditLimitCents,
      available_limit_cents: values.availableLimitCents,
      closing_day: values.closingDay,
      due_day: values.dueDay,
      color: values.color,
      last_four: values.lastFour,
      is_active: values.isActive,
    };

    if (editingCard) {
      updateCreditCard(editingCard.id, payload);
      toast.success("Cartão atualizado", {
        description: `${values.name} foi salvo com segurança.`,
      });
    } else {
      addCreditCard(payload);
      toast.success("Cartão criado", {
        description: "Apenas os quatro últimos dígitos foram armazenados.",
      });
    }

    setDialogOpen(false);
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 rounded-[28px] border border-[var(--card-border)] bg-[rgba(8,13,36,0.55)] p-6 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cyan)]">
            Cartões · {formatMonthYear(`${selectedMonth}-01`)}
          </p>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Cartões de crédito
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Controle limites, vencimentos e a fatura simulada pelas transações do mês.
              Nunca registre número completo do cartão ou CVV.
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Novo cartão
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Limite ativo" value={formatCurrency(totalLimit)} />
        <MetricCard label="Disponível" value={formatCurrency(totalAvailable)} />
        <MetricCard
          label="Usado"
          value={formatCurrency(totalUsed)}
          tone={totalLimit > 0 && totalUsed / totalLimit >= 0.8 ? "warning" : "default"}
        />
      </section>

      {creditCards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum cartão cadastrado"
          description="Adicione cartões usando somente apelido, banco, bandeira e os últimos quatro dígitos."
          action={<Button onClick={openCreateDialog}>Adicionar cartão</Button>}
        />
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {creditCards.map((card) => {
            const usage = cardUsage(card);
            const invoice = invoiceByCard.get(card.id) ?? emptyInvoice;
            const level = usageLevel(usage.usageRatio);

            return (
              <Card key={card.id} className="overflow-hidden">
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: card.color }}
                />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{card.name}</CardTitle>
                      <CardDescription>
                        {card.bank} · {cardBrandLabels[card.brand]} · final{" "}
                        {card.last_four || "----"}
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={card.is_active ? "success" : "muted"}>
                        {card.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${card.name}`}
                        onClick={() => openEditDialog(card)}
                      >
                        <Edit3 className="size-4" />
                      </Button>
                      <ConfirmDialog
                        title="Excluir cartão?"
                        description={`As transações vinculadas a ${card.name} continuarão no histórico.`}
                        confirmLabel="Excluir"
                        destructive
                        trigger={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Excluir ${card.name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        }
                        onConfirm={() => {
                          deleteCreditCard(card.id);
                          toast.success("Cartão excluído");
                        }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniMetric label="Limite" value={formatCurrency(card.credit_limit_cents)} />
                    <MiniMetric
                      label="Disponível"
                      value={formatCurrency(card.available_limit_cents)}
                    />
                    <MiniMetric label="Usado" value={formatCurrency(usage.usedCents)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[var(--muted)]">Uso do limite</span>
                      <span className={cn("font-black", level.textClass)}>
                        {formatPercent(usage.usageRatio)}
                      </span>
                    </div>
                    <ColoredProgress value={usage.usageRatio} level={level.name} />
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      Fecha dia {card.closing_day} · vence dia {card.due_day}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="flex items-center gap-2">
                      <ReceiptText className="size-4 text-[var(--cyan)]" />
                      <h3 className="text-sm font-bold text-white">
                        Fatura mock do mês
                      </h3>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <MiniMetric label="Total" value={formatCurrency(invoice.totalCents)} />
                      <MiniMetric label="Pago" value={formatCurrency(invoice.paidCents)} />
                      <MiniMetric label="Aberto" value={formatCurrency(invoice.openCents)} />
                    </div>
                    <div className="mt-4 space-y-2">
                      {invoice.transactions.slice(0, 4).map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="truncate text-[var(--muted)]">
                            {transaction.description}
                          </span>
                          <span className="font-bold text-white">
                            {formatCurrency(transaction.amount_cents)}
                          </span>
                        </div>
                      ))}
                      {invoice.transactions.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">
                          Nenhuma compra no cartão neste mês.
                        </p>
                      ) : null}
                    </div>
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
              {editingCard ? "Editar cartão" : "Novo cartão de crédito"}
            </DialogTitle>
            <DialogDescription>
              Cadastre apenas dados operacionais. Não informe número completo ou CVV.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="rounded-2xl border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.08)] p-4 text-sm text-[#b6f3ff]">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <p>
                  Por segurança, armazene somente os últimos quatro dígitos. Dados
                  sensíveis como número completo e CVV nunca devem ser salvos.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nome" error={form.formState.errors.name?.message}>
                <Input placeholder="Ex.: Nubank Roxinho" {...form.register("name")} />
              </FormField>
              <FormField label="Banco" error={form.formState.errors.bank?.message}>
                <Input placeholder="Ex.: Nubank" {...form.register("bank")} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Controller
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormField label="Bandeira">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cardBrandOptions.map((option) => (
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
                label="Últimos 4 dígitos"
                error={form.formState.errors.lastFour?.message}
              >
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="4382"
                  {...form.register("lastFour")}
                />
              </FormField>
              <FormField label="Cor" error={form.formState.errors.color?.message}>
                <Input type="color" className="h-12 p-2" {...form.register("color")} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="creditLimitCents"
                render={({ field }) => (
                  <FormField
                    label="Limite total"
                    error={form.formState.errors.creditLimitCents?.message}
                  >
                    <MoneyInput value={field.value} onValueChange={field.onChange} />
                  </FormField>
                )}
              />
              <Controller
                control={form.control}
                name="availableLimitCents"
                render={({ field }) => (
                  <FormField
                    label="Limite disponível"
                    error={form.formState.errors.availableLimitCents?.message}
                  >
                    <MoneyInput value={field.value} onValueChange={field.onChange} />
                  </FormField>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="Dia de fechamento"
                error={form.formState.errors.closingDay?.message}
              >
                <Input
                  type="number"
                  min={1}
                  max={31}
                  {...form.register("closingDay", { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Dia de vencimento"
                error={form.formState.errors.dueDay?.message}
              >
                <Input
                  type="number"
                  min={1}
                  max={31}
                  {...form.register("dueDay", { valueAsNumber: true })}
                />
              </FormField>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.72)] px-4 py-3">
                    <div>
                      <Label>Ativo</Label>
                      <p className="text-xs text-[var(--muted)]">Inclui no resumo</p>
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
              <Button type="submit">{editingCard ? "Salvar cartão" : "Criar cartão"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type InvoiceSummary = {
  totalCents: number;
  paidCents: number;
  openCents: number;
  transactions: Transaction[];
};

const emptyInvoice: InvoiceSummary = {
  totalCents: 0,
  paidCents: 0,
  openCents: 0,
  transactions: [],
};

function buildInvoiceSummaries(transactions: Transaction[], month: string) {
  const range = getMonthRange(month);
  const summaries = new Map<string, InvoiceSummary>();

  for (const transaction of transactions) {
    if (
      transaction.type !== "expense" ||
      !transaction.credit_card_id ||
      transaction.date < range.start ||
      transaction.date > range.end
    ) {
      continue;
    }

    const current = summaries.get(transaction.credit_card_id) ?? {
      totalCents: 0,
      paidCents: 0,
      openCents: 0,
      transactions: [],
    };

    current.totalCents += transaction.amount_cents;
    if (transaction.status === "paid") current.paidCents += transaction.amount_cents;
    else current.openCents += transaction.amount_cents;
    current.transactions.push(transaction);
    summaries.set(transaction.credit_card_id, current);
  }

  for (const summary of summaries.values()) {
    summary.transactions.sort((a, b) => b.date.localeCompare(a.date));
  }

  return summaries;
}

function usageLevel(ratio: number) {
  if (ratio >= 1) {
    return { name: "critical" as const, textClass: "text-[#ffc2ca]" };
  }
  if (ratio >= 0.8) {
    return { name: "warning" as const, textClass: "text-[#fde3a3]" };
  }
  return { name: "ok" as const, textClass: "text-[#a8f7d8]" };
}

function ColoredProgress({
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

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-black text-white",
          tone === "warning" && "text-[#fde3a3]"
        )}
      >
        {value}
      </p>
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
