"use client";

import { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDownUp,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoneyInput } from "@/components/shared/money-input";
import { useFinance } from "@/contexts/finance-context";
import { exportTransactionsCsv, parseTransactionsCsv } from "@/lib/csv";
import { formatDate, nowInSaoPaulo, toISODate } from "@/lib/date";
import {
  labelFor,
  paymentMethodLabels,
  paymentMethodOptions,
  transactionStatusLabels,
  transactionStatusOptions,
  transactionTypeLabels,
} from "@/lib/labels";
import { formatCurrency } from "@/lib/money";
import { getTransactionStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";
import {
  transactionDefaultValues,
  transactionFormSchema,
  type TransactionFormValues,
} from "@/lib/validations/transaction";
import type {
  Account,
  Category,
  CreditCard,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/types/database";

const ALL_VALUE = "__all";
const NONE_VALUE = "__none";
const PAGE_SIZE = 10;

type SortOption =
  | "date_desc"
  | "date_asc"
  | "amount_desc"
  | "amount_asc"
  | "description_asc";

type TransactionDialogState =
  | { mode: "create"; transaction?: undefined }
  | { mode: "edit"; transaction: Transaction };

export default function TransactionsPage() {
  const {
    accounts,
    categories,
    creditCards,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<typeof ALL_VALUE | TransactionType>(ALL_VALUE);
  const [statusFilter, setStatusFilter] = useState<typeof ALL_VALUE | TransactionStatus>(ALL_VALUE);
  const [categoryFilter, setCategoryFilter] = useState(ALL_VALUE);
  const [sourceFilter, setSourceFilter] = useState(ALL_VALUE);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState<SortOption>("date_desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState(NONE_VALUE);
  const [dialogState, setDialogState] = useState<TransactionDialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );
  const cardMap = useMemo(
    () => new Map(creditCards.map((card) => [card.id, card])),
    [creditCards]
  );

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return [...transactions]
      .filter((transaction) => {
        if (typeFilter !== ALL_VALUE && transaction.type !== typeFilter) return false;
        if (statusFilter !== ALL_VALUE && transaction.status !== statusFilter) return false;
        if (categoryFilter !== ALL_VALUE && transaction.category_id !== categoryFilter) return false;
        if (
          sourceFilter !== ALL_VALUE &&
          transaction.account_id !== sourceFilter &&
          transaction.credit_card_id !== sourceFilter
        ) {
          return false;
        }
        if (startDate && transaction.date < startDate) return false;
        if (endDate && transaction.date > endDate) return false;

        if (!normalizedQuery) return true;

        const category = transaction.category_id
          ? categoryMap.get(transaction.category_id)?.name
          : undefined;
        const subcategory = transaction.subcategory_id
          ? categoryMap.get(transaction.subcategory_id)?.name
          : undefined;
        const account = transaction.account_id
          ? accountMap.get(transaction.account_id)?.name
          : undefined;
        const card = transaction.credit_card_id
          ? cardMap.get(transaction.credit_card_id)?.name
          : undefined;

        return [
          transaction.description,
          category,
          subcategory,
          account,
          card,
          transaction.notes,
          transaction.tags.join(" "),
        ]
          .filter(Boolean)
          .some((value) => normalizeText(String(value)).includes(normalizedQuery));
      })
      .sort((a, b) => sortTransactions(a, b, sort));
  }, [
    accountMap,
    cardMap,
    categoryFilter,
    categoryMap,
    endDate,
    query,
    sort,
    sourceFilter,
    startDate,
    statusFilter,
    transactions,
    typeFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const selectedTransactions = transactions.filter((transaction) =>
    selectedIds.has(transaction.id)
  );
  const selectedCount = selectedTransactions.length;
  const allPageSelected =
    paginatedTransactions.length > 0 &&
    paginatedTransactions.every((transaction) => selectedIds.has(transaction.id));

  function resetFilters() {
    setQuery("");
    setTypeFilter(ALL_VALUE);
    setStatusFilter(ALL_VALUE);
    setCategoryFilter(ALL_VALUE);
    setSourceFilter(ALL_VALUE);
    setStartDate("");
    setEndDate("");
    setSort("date_desc");
    setPage(1);
  }

  function toggleSelection(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function togglePageSelection(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const transaction of paginatedTransactions) {
        if (checked) next.add(transaction.id);
        else next.delete(transaction.id);
      }
      return next;
    });
  }

  function markAsPaid(transaction: Transaction) {
    updateTransaction(transaction.id, {
      status: "paid",
      payment_date: transaction.payment_date ?? toISODate(nowInSaoPaulo()),
    });
    toast.success("Transação marcada como paga.");
  }

  function duplicateTransaction(transaction: Transaction) {
    addTransaction({
      description: `${transaction.description} (cópia)`,
      amount_cents: transaction.amount_cents,
      type: transaction.type,
      category_id: transaction.category_id,
      subcategory_id: transaction.subcategory_id,
      date: toISODate(nowInSaoPaulo()),
      due_date: transaction.due_date,
      payment_date: transaction.status === "paid" ? toISODate(nowInSaoPaulo()) : null,
      account_id: transaction.account_id,
      credit_card_id: transaction.credit_card_id,
      payment_method: transaction.payment_method,
      status: transaction.status,
      notes: transaction.notes,
      attachment_url: transaction.attachment_url,
      is_recurring: transaction.is_recurring,
      installment_total: transaction.installment_total,
      installment_current: transaction.installment_current,
      parent_transaction_id: transaction.parent_transaction_id,
      tags: transaction.tags,
    });
    toast.success("Transação duplicada.");
  }

  function handleDelete(transaction: Transaction) {
    deleteTransaction(transaction.id);
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(transaction.id);
      return next;
    });
    setDeleteTarget(null);
    toast.success("Transação excluída.");
  }

  function handleBulkDelete() {
    for (const transaction of selectedTransactions) {
      deleteTransaction(transaction.id);
    }
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
    toast.success(`${selectedCount} transações excluídas.`);
  }

  function handleBulkMarkPaid() {
    const today = toISODate(nowInSaoPaulo());
    for (const transaction of selectedTransactions) {
      updateTransaction(transaction.id, {
        status: "paid",
        payment_date: transaction.payment_date ?? today,
      });
    }
    setSelectedIds(new Set());
    toast.success(`${selectedCount} transações marcadas como pagas.`);
  }

  function handleBulkCategoryUpdate() {
    const categoryId = bulkCategoryId === NONE_VALUE ? null : bulkCategoryId;
    for (const transaction of selectedTransactions) {
      updateTransaction(transaction.id, {
        category_id: categoryId,
        subcategory_id: null,
      });
    }
    setSelectedIds(new Set());
    setBulkCategoryId(NONE_VALUE);
    toast.success("Categoria atualizada em lote.");
  }

  function handleSaveTransaction(values: TransactionFormValues) {
    const payload = {
      description: values.description.trim(),
      amount_cents: values.amount_cents,
      type: values.type,
      category_id: values.category_id,
      subcategory_id: values.subcategory_id,
      date: values.date,
      due_date: values.due_date,
      payment_date: values.payment_date,
      account_id: values.account_id,
      credit_card_id: values.credit_card_id,
      payment_method: values.payment_method,
      status: values.status,
      notes: values.notes?.trim() ? values.notes.trim() : null,
      attachment_url: null,
      is_recurring: values.is_recurring,
      installment_total: values.installment_total,
      installment_current: values.installment_current,
      parent_transaction_id: null,
      tags: parseTagsInput(values.tags),
    };

    if (dialogState?.mode === "edit") {
      updateTransaction(dialogState.transaction.id, payload);
      toast.success("Transação atualizada.");
    } else {
      addTransaction(payload);
      toast.success("Transação criada.");
    }
    setDialogState(null);
  }

  async function handleCsvImport(file: File) {
    const text = await file.text();
    const result = parseTransactionsCsv(text);
    const categoryByName = buildNameLookup(categories);
    const accountByName = buildNameLookup(accounts);
    const cardByName = buildNameLookup(creditCards);

    for (const parsed of result.data) {
      addTransaction({
        description: parsed.description,
        amount_cents: parsed.amount_cents,
        type: parsed.type,
        category_id: parsed.category_name
          ? categoryByName.get(normalizeText(parsed.category_name))?.id ?? null
          : null,
        subcategory_id: null,
        date: parsed.date,
        due_date: parsed.due_date,
        payment_date: parsed.payment_date,
        account_id: parsed.account_name
          ? accountByName.get(normalizeText(parsed.account_name))?.id ?? null
          : null,
        credit_card_id: parsed.credit_card_name
          ? cardByName.get(normalizeText(parsed.credit_card_name))?.id ?? null
          : null,
        payment_method: parsed.payment_method,
        status: parsed.status,
        notes: parsed.notes,
        attachment_url: null,
        is_recurring: false,
        installment_total: null,
        installment_current: null,
        parent_transaction_id: null,
        tags: parsed.tags,
      });
    }

    if (result.data.length > 0) {
      toast.success(`${result.data.length} transações importadas.`);
    }
    if (result.errors.length > 0) {
      toast.warning("CSV importado com avisos", {
        description: `${result.errors.length} linhas/campos precisam de revisão.`,
      });
    }
    if (result.data.length === 0 && result.errors.length === 0) {
      toast.info("Nenhuma transação encontrada no CSV.");
    }
  }

  function handleCsvExport() {
    const csv = exportTransactionsCsv(
      filteredTransactions.map((transaction) => ({
        ...transaction,
        category_name: transaction.category_id
          ? categoryMap.get(transaction.category_id)?.name
          : null,
        account_name: transaction.account_id ? accountMap.get(transaction.account_id)?.name : null,
        credit_card_name: transaction.credit_card_id
          ? cardMap.get(transaction.credit_card_id)?.name
          : null,
      })),
      { includeBom: true }
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `transacoes-${toISODate(nowInSaoPaulo())}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado.");
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cyan)]">
            Transações
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--foreground)]">
            Gestão de lançamentos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Busque, filtre, importe, exporte e concilie receitas e despesas em reais.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void handleCsvImport(file);
              event.currentTarget.value = "";
            }}
          />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />
            Importar CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={filteredTransactions.length === 0}
            onClick={handleCsvExport}
          >
            <Download className="size-4" />
            Exportar CSV
          </Button>
          <Button
            type="button"
            onClick={() =>
              setDialogState({
                mode: "create",
              })
            }
          >
            <Plus className="size-4" />
            Nova transação
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Filtros</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Limpar filtros
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por descrição, tags, categoria, conta..."
                className="pl-11"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as typeof ALL_VALUE | TransactionType);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as typeof ALL_VALUE | TransactionStatus);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos os status</SelectItem>
                {transactionStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sourceFilter}
              onValueChange={(value) => {
                setSourceFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todas as contas e cartões</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
                {creditCards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
              aria-label="Data inicial"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
              aria-label="Data final"
            />
            <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
              <SelectTrigger>
                <ArrowDownUp className="size-4 text-[var(--muted)]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Mais recentes</SelectItem>
                <SelectItem value="date_asc">Mais antigas</SelectItem>
                <SelectItem value="amount_desc">Maior valor</SelectItem>
                <SelectItem value="amount_asc">Menor valor</SelectItem>
                <SelectItem value="description_asc">Descrição A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {selectedCount > 0 ? (
        <Card className="border-[rgba(20,115,255,0.36)] bg-[rgba(20,115,255,0.1)]">
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {selectedCount} transaç{selectedCount === 1 ? "ão selecionada" : "ões selecionadas"}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                <SelectTrigger className="sm:w-64">
                  <SelectValue placeholder="Categoria em lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sem categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="secondary" onClick={handleBulkCategoryUpdate}>
                Atualizar categoria
              </Button>
              <Button type="button" variant="success" onClick={handleBulkMarkPaid}>
                <CheckCircle2 className="size-4" />
                Marcar pagas
              </Button>
              <Button type="button" variant="danger" onClick={() => setConfirmBulkDelete(true)}>
                <Trash2 className="size-4" />
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={WalletCards}
          title="Nenhuma transação encontrada"
          description="Crie uma transação manualmente, importe um CSV ou ajuste os filtros para visualizar lançamentos."
          action={
            <Button type="button" onClick={() => setDialogState({ mode: "create" })}>
              <Plus className="size-4" />
              Nova transação
            </Button>
          }
        />
      ) : (
        <>
          <section className="hidden overflow-hidden rounded-[28px] border border-[var(--card-border)] bg-[rgba(8,13,36,0.55)] lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--card-border)] text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    <th className="w-12 px-5 py-4">
                      <Checkbox
                        checked={allPageSelected}
                        onCheckedChange={(checked) => togglePageSelection(checked === true)}
                        aria-label="Selecionar página"
                      />
                    </th>
                    <th className="px-5 py-4 font-semibold">Descrição</th>
                    <th className="px-5 py-4 font-semibold">Categoria</th>
                    <th className="px-5 py-4 font-semibold">Data</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Conta</th>
                    <th className="px-5 py-4 text-right font-semibold">Valor</th>
                    <th className="w-16 px-5 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {paginatedTransactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      selected={selectedIds.has(transaction.id)}
                      category={transaction.category_id ? categoryMap.get(transaction.category_id) : undefined}
                      subcategory={
                        transaction.subcategory_id
                          ? categoryMap.get(transaction.subcategory_id)
                          : undefined
                      }
                      account={transaction.account_id ? accountMap.get(transaction.account_id) : undefined}
                      card={transaction.credit_card_id ? cardMap.get(transaction.credit_card_id) : undefined}
                      onSelect={(checked) => toggleSelection(transaction.id, checked)}
                      onEdit={() => setDialogState({ mode: "edit", transaction })}
                      onDelete={() => setDeleteTarget(transaction)}
                      onDuplicate={() => duplicateTransaction(transaction)}
                      onMarkPaid={() => markAsPaid(transaction)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:hidden">
            {paginatedTransactions.map((transaction) => (
              <TransactionMobileCard
                key={transaction.id}
                transaction={transaction}
                selected={selectedIds.has(transaction.id)}
                category={transaction.category_id ? categoryMap.get(transaction.category_id) : undefined}
                account={transaction.account_id ? accountMap.get(transaction.account_id) : undefined}
                card={transaction.credit_card_id ? cardMap.get(transaction.credit_card_id) : undefined}
                onSelect={(checked) => toggleSelection(transaction.id, checked)}
                onEdit={() => setDialogState({ mode: "edit", transaction })}
                onDelete={() => setDeleteTarget(transaction)}
                onDuplicate={() => duplicateTransaction(transaction)}
                onMarkPaid={() => markAsPaid(transaction)}
              />
            ))}
          </section>

          <div className="flex flex-col gap-3 rounded-3xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.45)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted)]">
              Exibindo {paginatedTransactions.length} de {filteredTransactions.length} transações
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Anterior
              </Button>
              <span className="px-3 text-sm font-semibold text-[var(--foreground)]">
                {currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                Próxima
              </Button>
            </div>
          </div>
        </>
      )}

      <TransactionFormDialog
        state={dialogState}
        accounts={accounts}
        categories={categories}
        creditCards={creditCards}
        onOpenChange={(open) => {
          if (!open) setDialogState(null);
        }}
        onSubmit={handleSaveTransaction}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Excluir transação?"
        description="Essa ação remove o lançamento do painel demo."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
        }}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title="Excluir transações selecionadas?"
        description={`Você está prestes a excluir ${selectedCount} transações.`}
        confirmLabel="Excluir selecionadas"
        destructive
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}

function TransactionRow({
  transaction,
  selected,
  category,
  subcategory,
  account,
  card,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onMarkPaid,
}: {
  transaction: Transaction;
  selected: boolean;
  category?: Category;
  subcategory?: Category;
  account?: Account;
  card?: CreditCard;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMarkPaid: () => void;
}) {
  const statusMeta = getTransactionStatusMeta(transaction.status);
  const source = account?.name ?? card?.name ?? "Sem conta";

  return (
    <tr className="transition-colors hover:bg-white/[0.03]">
      <td className="px-5 py-4">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(checked === true)}
          aria-label={`Selecionar ${transaction.description}`}
        />
      </td>
      <td className="px-5 py-4">
        <div className="font-semibold text-[var(--foreground)]">{transaction.description}</div>
        <div className="mt-1 text-xs text-[var(--muted)]">
          {transaction.payment_method
            ? labelFor(paymentMethodLabels, transaction.payment_method)
            : "Sem método"}
          {transaction.tags.length ? ` · ${transaction.tags.join(", ")}` : ""}
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-2 text-[var(--muted)]">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: category?.color ?? "#64748b" }}
            aria-hidden="true"
          />
          {subcategory ? `${category?.name ?? "Outros"} / ${subcategory.name}` : category?.name ?? "Outros"}
        </span>
      </td>
      <td className="px-5 py-4 text-[var(--muted)]">
        <div>{formatDate(transaction.date)}</div>
        {transaction.due_date ? (
          <div className="mt-1 text-xs">Venc. {formatDate(transaction.due_date)}</div>
        ) : null}
      </td>
      <td className="px-5 py-4">
        <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
      </td>
      <td className="px-5 py-4 text-[var(--muted)]">{source}</td>
      <td
        className={cn(
          "px-5 py-4 text-right font-black",
          transaction.type === "income" ? "text-[#a8f7d8]" : "text-[var(--foreground)]"
        )}
      >
        {transaction.type === "expense" ? "-" : "+"}
        {formatCurrency(transaction.amount_cents)}
      </td>
      <td className="px-5 py-4 text-right">
        <TransactionActions
          canMarkPaid={transaction.status !== "paid"}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onMarkPaid={onMarkPaid}
        />
      </td>
    </tr>
  );
}

function TransactionMobileCard({
  transaction,
  selected,
  category,
  account,
  card,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onMarkPaid,
}: {
  transaction: Transaction;
  selected: boolean;
  category?: Category;
  account?: Account;
  card?: CreditCard;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMarkPaid: () => void;
}) {
  const statusMeta = getTransactionStatusMeta(transaction.status);

  return (
    <article className="glass-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect(checked === true)}
            aria-label={`Selecionar ${transaction.description}`}
          />
          <div className="min-w-0">
            <h3 className="truncate font-bold text-[var(--foreground)]">
              {transaction.description}
            </h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {formatDate(transaction.date)} · {account?.name ?? card?.name ?? "Sem conta"}
            </p>
          </div>
        </div>
        <TransactionActions
          canMarkPaid={transaction.status !== "paid"}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onMarkPaid={onMarkPaid}
        />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: category?.color ?? "#64748b" }}
            aria-hidden="true"
          />
          {category?.name ?? "Outros"}
        </div>
        <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
      </div>
      <div
        className={cn(
          "mt-4 text-right text-lg font-black",
          transaction.type === "income" ? "text-[#a8f7d8]" : "text-[var(--foreground)]"
        )}
      >
        {transaction.type === "expense" ? "-" : "+"}
        {formatCurrency(transaction.amount_cents)}
      </div>
    </article>
  );
}

function TransactionActions({
  canMarkPaid,
  onEdit,
  onDelete,
  onDuplicate,
  onMarkPaid,
}: {
  canMarkPaid: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMarkPaid: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="size-9 rounded-xl">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Abrir ações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onEdit}>
          <Edit3 className="size-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}>
          <Copy className="size-4" />
          Duplicar
        </DropdownMenuItem>
        {canMarkPaid ? (
          <DropdownMenuItem onSelect={onMarkPaid}>
            <CheckCircle2 className="size-4" />
            Marcar paga
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[#ffc2ca]" onSelect={onDelete}>
          <Trash2 className="size-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TransactionFormDialog({
  state,
  accounts,
  categories,
  creditCards,
  onOpenChange,
  onSubmit,
}: {
  state: TransactionDialogState | null;
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCard[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TransactionFormValues) => void;
}) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    values: state?.transaction
      ? valuesFromTransaction(state.transaction)
      : {
          ...transactionDefaultValues,
          date: toISODate(nowInSaoPaulo()),
          payment_date: toISODate(nowInSaoPaulo()),
        },
  });
  const selectedType = useWatch({ control: form.control, name: "type" });
  const selectedCategory = useWatch({ control: form.control, name: "category_id" });
  const categoryOptions = categories.filter(
    (category) =>
      !category.parent_id && (category.type === selectedType || category.type === "both")
  );
  const subcategoryOptions = selectedCategory
    ? categories.filter((category) => category.parent_id === selectedCategory)
    : [];

  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {state?.mode === "edit" ? "Editar transação" : "Nova transação"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do lançamento, conta, vencimento e conciliação.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-[1.5fr_0.8fr_0.8fr]">
            <Field label="Descrição" error={form.formState.errors.description?.message}>
              <Input placeholder="Ex.: Mercado, salário, aluguel..." {...form.register("description")} />
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
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Field label="Tipo">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">{transactionTypeLabels.expense}</SelectItem>
                      <SelectItem value="income">{transactionTypeLabels.income}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <Field label="Categoria">
                  <Select
                    value={field.value ?? NONE_VALUE}
                    onValueChange={(value) => {
                      field.onChange(value === NONE_VALUE ? null : value);
                      form.setValue("subcategory_id", null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Sem categoria</SelectItem>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="subcategory_id"
              render={({ field }) => (
                <Field label="Subcategoria">
                  <Select
                    value={field.value ?? NONE_VALUE}
                    onValueChange={(value) => field.onChange(value === NONE_VALUE ? null : value)}
                    disabled={subcategoryOptions.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          subcategoryOptions.length ? "Selecionar subcategoria" : "Sem subcategorias"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Sem subcategoria</SelectItem>
                      {subcategoryOptions.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Data" error={form.formState.errors.date?.message}>
              <Input type="date" {...form.register("date")} />
            </Field>
            <Controller
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <Field label="Vencimento">
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
              name="payment_date"
              render={({ field }) => (
                <Field label="Pagamento">
                  <Input
                    type="date"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value || null)}
                  />
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
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
            <Controller
              control={form.control}
              name="credit_card_id"
              render={({ field }) => (
                <Field label="Cartão">
                  <Select
                    value={field.value ?? NONE_VALUE}
                    onValueChange={(value) => field.onChange(value === NONE_VALUE ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cartão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Sem cartão</SelectItem>
                      {creditCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <Field label="Método">
                  <Select
                    value={field.value ?? NONE_VALUE}
                    onValueChange={(value) => field.onChange(value === NONE_VALUE ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Não informado</SelectItem>
                      {paymentMethodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
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
                      {transactionStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {transactionStatusLabels[option.value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Controller
              control={form.control}
              name="installment_current"
              render={({ field }) => (
                <Field label="Parcela atual" error={form.formState.errors.installment_current?.message}>
                  <Input
                    type="number"
                    min={1}
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(parseOptionalNumber(event.target.value))}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="installment_total"
              render={({ field }) => (
                <Field label="Total de parcelas" error={form.formState.errors.installment_total?.message}>
                  <Input
                    type="number"
                    min={1}
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(parseOptionalNumber(event.target.value))}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="is_recurring"
              render={({ field }) => (
                <div className="flex items-end">
                  <label className="flex h-12 w-full items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.72)] px-4 text-sm font-semibold text-[var(--foreground)]">
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                    Recorrente
                  </label>
                </div>
              )}
            />
          </div>

          <Field label="Tags">
            <Input placeholder="mercado, casa, trabalho" {...form.register("tags")} />
          </Field>

          <Controller
            control={form.control}
            name="notes"
            render={({ field }) => (
              <Field label="Observações">
                <Textarea
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value || null)}
                  placeholder="Detalhes, comprovante, contexto..."
                />
              </Field>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {state?.mode === "edit" ? "Salvar alterações" : "Criar transação"}
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

function valuesFromTransaction(transaction: Transaction): TransactionFormValues {
  return {
    description: transaction.description,
    amount_cents: transaction.amount_cents,
    type: transaction.type,
    category_id: transaction.category_id,
    subcategory_id: transaction.subcategory_id,
    date: transaction.date,
    due_date: transaction.due_date,
    payment_date: transaction.payment_date,
    account_id: transaction.account_id,
    credit_card_id: transaction.credit_card_id,
    payment_method: transaction.payment_method,
    status: transaction.status,
    notes: transaction.notes,
    is_recurring: transaction.is_recurring,
    installment_total: transaction.installment_total,
    installment_current: transaction.installment_current,
    tags: transaction.tags.join(", "),
  };
}

function parseOptionalNumber(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTagsInput(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function buildNameLookup<T extends { name: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [normalizeText(item.name), item]));
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function sortTransactions(a: Transaction, b: Transaction, sort: SortOption): number {
  switch (sort) {
    case "date_asc":
      return a.date.localeCompare(b.date);
    case "amount_desc":
      return b.amount_cents - a.amount_cents;
    case "amount_asc":
      return a.amount_cents - b.amount_cents;
    case "description_asc":
      return a.description.localeCompare(b.description, "pt-BR");
    case "date_desc":
    default:
      return b.date.localeCompare(a.date);
  }
}
