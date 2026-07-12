"use client";

import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit3,
  Landmark,
  Plus,
  Trash2,
  WalletCards,
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
import { Switch } from "@/components/ui/switch";
import { useFinance } from "@/contexts/finance-context";
import { totalBalance } from "@/lib/calculations";
import { accountTypeLabels, accountTypeOptions } from "@/lib/labels";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Account, AccountType } from "@/types/database";

const accountSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da conta."),
  institution: z.string().trim().min(2, "Informe a instituição."),
  type: z.enum(["checking", "savings", "wallet", "cash", "investment"]),
  initialBalanceCents: z.number().int(),
  currentBalanceCents: z.number().int(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal."),
  isActive: z.boolean(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

const defaultValues: AccountFormValues = {
  name: "",
  institution: "",
  type: "checking",
  initialBalanceCents: 0,
  currentBalanceCents: 0,
  color: "#1473FF",
  isActive: true,
};

export default function AccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues,
  });

  const activeTotal = totalBalance(accounts);
  const allTotal = accounts.reduce((sum, account) => sum + account.current_balance_cents, 0);
  const inactiveTotal = accounts
    .filter((account) => !account.is_active)
    .reduce((sum, account) => sum + account.current_balance_cents, 0);

  function openCreateDialog() {
    setEditingAccount(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  }

  function openEditDialog(account: Account) {
    setEditingAccount(account);
    form.reset({
      name: account.name,
      institution: account.institution,
      type: account.type,
      initialBalanceCents: account.initial_balance_cents,
      currentBalanceCents: account.current_balance_cents,
      color: account.color,
      isActive: account.is_active,
    });
    setDialogOpen(true);
  }

  function onSubmit(values: AccountFormValues) {
    const payload = {
      name: values.name,
      institution: values.institution,
      type: values.type as AccountType,
      initial_balance_cents: values.initialBalanceCents,
      current_balance_cents: values.currentBalanceCents,
      color: values.color,
      is_active: values.isActive,
    };

    if (editingAccount) {
      updateAccount(editingAccount.id, payload);
      toast.success("Conta atualizada", {
        description: `${values.name} foi salva com sucesso.`,
      });
    } else {
      addAccount(payload);
      toast.success("Conta adicionada", {
        description: `${values.name} entrou no seu resumo financeiro.`,
      });
    }

    setDialogOpen(false);
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 rounded-[28px] border border-[var(--card-border)] bg-[rgba(8,13,36,0.55)] p-6 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cyan)]">
            Contas bancárias
          </p>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Saldos e instituições
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Cadastre contas correntes, poupanças, carteiras digitais, dinheiro e
              investimentos para consolidar seu saldo.
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Nova conta
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Saldo ativo" value={formatCurrency(activeTotal)} icon={WalletCards} />
        <SummaryCard label="Saldo total" value={formatCurrency(allTotal)} icon={Landmark} />
        <SummaryCard
          label="Contas inativas"
          value={formatCurrency(inactiveTotal)}
          icon={WalletCards}
          muted
        />
      </section>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhuma conta cadastrada"
          description="Comece adicionando a conta principal para acompanhar seu saldo total."
          action={<Button onClick={openCreateDialog}>Adicionar conta</Button>}
        />
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="overflow-hidden">
              <div className="h-1.5 w-full" style={{ backgroundColor: account.color }} />
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{account.name}</CardTitle>
                    <CardDescription>{account.institution}</CardDescription>
                  </div>
                  <Badge variant={account.is_active ? "success" : "muted"}>
                    {account.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-[var(--muted)]">Saldo atual</p>
                  <p
                    className={cn(
                      "mt-1 text-3xl font-black",
                      account.current_balance_cents >= 0
                        ? "text-white"
                        : "text-[#ffc2ca]"
                    )}
                  >
                    {formatCurrency(account.current_balance_cents)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoBlock
                    label="Tipo"
                    value={accountTypeLabels[account.type]}
                    badge
                  />
                  <InfoBlock
                    label="Saldo inicial"
                    value={formatCurrency(account.initial_balance_cents)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-white">Incluir nos resumos</p>
                    <p className="text-xs text-[var(--muted)]">Alterna o status ativo</p>
                  </div>
                  <Switch
                    checked={account.is_active}
                    onCheckedChange={(checked) => {
                      updateAccount(account.id, { is_active: checked });
                      toast.success(checked ? "Conta ativada" : "Conta desativada");
                    }}
                    aria-label={`Alternar ${account.name}`}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditDialog(account)}
                  >
                    <Edit3 className="size-4" />
                    Editar
                  </Button>
                  <ConfirmDialog
                    title="Excluir conta?"
                    description={`A conta ${account.name} será removida do demo local.`}
                    confirmLabel="Excluir"
                    destructive
                    trigger={
                      <Button type="button" variant="danger" size="sm">
                        <Trash2 className="size-4" />
                        Excluir
                      </Button>
                    }
                    onConfirm={() => {
                      deleteAccount(account.id);
                      toast.success("Conta excluída");
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar conta" : "Nova conta"}</DialogTitle>
            <DialogDescription>
              Informe instituição, tipo e saldos em reais para manter os totais atualizados.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nome" error={form.formState.errors.name?.message}>
                <Input placeholder="Ex.: Nubank Conta" {...form.register("name")} />
              </FormField>
              <FormField
                label="Instituição"
                error={form.formState.errors.institution?.message}
              >
                <Input placeholder="Ex.: Banco Inter" {...form.register("institution")} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormField label="Tipo">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accountTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />
              <FormField label="Cor" error={form.formState.errors.color?.message}>
                <Input type="color" className="h-12 p-2" {...form.register("color")} />
              </FormField>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.72)] px-4 py-3">
                    <div>
                      <Label>Ativa</Label>
                      <p className="text-xs text-[var(--muted)]">Entra no saldo ativo</p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="initialBalanceCents"
                render={({ field }) => (
                  <FormField
                    label="Saldo inicial"
                    error={form.formState.errors.initialBalanceCents?.message}
                  >
                    <MoneyInput value={field.value} onValueChange={field.onChange} />
                  </FormField>
                )}
              />
              <Controller
                control={form.control}
                name="currentBalanceCents"
                render={({ field }) => (
                  <FormField
                    label="Saldo atual"
                    error={form.formState.errors.currentBalanceCents?.message}
                  >
                    <MoneyInput value={field.value} onValueChange={field.onChange} />
                  </FormField>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingAccount ? "Salvar conta" : "Criar conta"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  muted = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  muted?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-[rgba(20,115,255,0.28)] bg-[rgba(20,115,255,0.12)] text-[var(--cyan)]">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
          <p className={cn("text-2xl font-black text-white", muted && "text-[var(--muted)]")}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function InfoBlock({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </p>
      {badge ? (
        <Badge className="mt-2" variant="cyan">
          {value}
        </Badge>
      ) : (
        <p className="mt-1 text-sm font-black text-white">{value}</p>
      )}
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
