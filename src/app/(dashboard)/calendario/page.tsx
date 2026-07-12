"use client";

import { useMemo, useState } from "react";
import { addDays, startOfWeek } from "date-fns";
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Landmark,
  ReceiptText,
  Repeat,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinance } from "@/contexts/finance-context";
import {
  computeStatusFromDates,
  formatDate,
  formatDateLong,
  formatMonthYear,
  monthKey,
  nowInSaoPaulo,
  sameCalendarDay,
  shiftMonth,
  toISODate,
} from "@/lib/date";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { FinancialEvent, FinancialEventType } from "@/types/database";

type CalendarView = "month" | "week" | "day";

export default function FinancialCalendarPage() {
  const {
    accounts,
    creditCards,
    debts,
    subscriptions,
    transactions,
  } = useFinance();
  const [selectedDate, setSelectedDate] = useState(() => toISODate(nowInSaoPaulo()));
  const [view, setView] = useState<CalendarView>("month");

  const selectedMonth = monthKey(selectedDate);
  const monthsInScope = useMemo(
    () => [
      shiftMonth(selectedMonth, -1),
      selectedMonth,
      shiftMonth(selectedMonth, 1),
    ],
    [selectedMonth]
  );

  const events = useMemo(
    () =>
      buildFinancialEvents({
        accounts,
        creditCards,
        debts,
        months: monthsInScope,
        subscriptions,
        transactions,
      }),
    [accounts, creditCards, debts, monthsInScope, subscriptions, transactions]
  );

  const selectedDayEvents = events
    .filter((event) => sameCalendarDay(event.date, selectedDate))
    .sort(sortEvents);

  const monthDays = useMemo(
    () => buildMonthGrid(selectedMonth),
    [selectedMonth]
  );
  const weekDays = useMemo(
    () => buildWeekDays(selectedDate),
    [selectedDate]
  );

  const totals = {
    income: events
      .filter((event) => event.type === "income")
      .reduce((sum, event) => sum + event.amount_cents, 0),
    expenses: events
      .filter((event) =>
        ["bill", "debt_installment", "subscription", "card_due"].includes(
          event.type
        )
      )
      .reduce((sum, event) => sum + event.amount_cents, 0),
    overdue: events.filter((event) => event.status === "overdue").length,
  };

  const moveMonth = (delta: number) => {
    const nextMonth = shiftMonth(selectedMonth, delta);
    setSelectedDate(`${nextMonth}-01`);
  };

  const moveDay = (delta: number) => {
    setSelectedDate(toISODate(addDays(parseDate(selectedDate), delta)));
  };

  return (
    <div className="space-y-8">
      <section className="glass-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="cyan" className="w-fit">
              Calendário financeiro
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Vencimentos, renovações e receitas previstas
            </h1>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Eventos consolidados a partir de transações, cartões, dívidas,
              assinaturas e receitas esperadas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="icon" onClick={() => moveMonth(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <div className="min-w-[220px] rounded-2xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.03)] px-5 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Período
              </p>
              <p className="font-black text-white">
                {formatMonthYear(`${selectedMonth}-01`)}
              </p>
            </div>
            <Button type="button" variant="outline" size="icon" onClick={() => moveMonth(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryTile
          icon={TrendingUp}
          label="Receitas previstas"
          value={formatCurrency(totals.income)}
          tone="success"
        />
        <SummaryTile
          icon={ReceiptText}
          label="Compromissos previstos"
          value={formatCurrency(totals.expenses)}
          tone="danger"
        />
        <SummaryTile
          icon={CalendarClock}
          label="Eventos atrasados"
          value={String(totals.overdue)}
          tone={totals.overdue > 0 ? "warning" : "success"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="glass-card p-5">
          <Tabs value={view} onValueChange={(value) => setView(value as CalendarView)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {formatDateLong(selectedDate)}
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Clique em um dia para ver os eventos detalhados.
                </p>
              </div>
              <TabsList>
                <TabsTrigger value="month">Mês</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="day">Dia</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="month" className="mt-6">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                {weekLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2">
                {monthDays.map((day) => (
                  <DayCell
                    key={day}
                    date={day}
                    compact
                    currentMonth={monthKey(day) === selectedMonth}
                    selected={sameCalendarDay(day, selectedDate)}
                    events={eventsForDate(events, day)}
                    onSelect={() => setSelectedDate(day)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="week" className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => moveDay(-7)}>
                  Semana anterior
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => moveDay(7)}>
                  Próxima semana
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-7">
                {weekDays.map((day) => (
                  <DayCell
                    key={day}
                    date={day}
                    selected={sameCalendarDay(day, selectedDate)}
                    events={eventsForDate(events, day)}
                    onSelect={() => setSelectedDate(day)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="day" className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => moveDay(-1)}>
                  Dia anterior
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDate(toISODate(nowInSaoPaulo()))}>
                  Hoje
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => moveDay(1)}>
                  Próximo dia
                </Button>
              </div>
              <div className="rounded-3xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.03)] p-5">
                <DayAgenda events={selectedDayEvents} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="glass-card p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Eventos do dia</h2>
              <p className="text-sm text-[var(--muted)]">
                {formatDateLong(selectedDate)}
              </p>
            </div>
            <Badge variant="muted">{selectedDayEvents.length}</Badge>
          </div>
          <DayAgenda events={selectedDayEvents} />
        </aside>
      </section>
    </div>
  );
}

function DayCell({
  date,
  currentMonth = true,
  selected,
  compact = false,
  events,
  onSelect,
}: {
  date: string;
  currentMonth?: boolean;
  selected: boolean;
  compact?: boolean;
  events: FinancialEvent[];
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "min-h-32 rounded-3xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.03)] p-3 text-left transition-all hover:border-[rgba(20,115,255,0.55)] hover:bg-[rgba(20,115,255,0.08)]",
        compact && "min-h-28",
        !currentMonth && "opacity-45",
        selected &&
          "border-[rgba(20,115,255,0.78)] bg-[rgba(20,115,255,0.14)] shadow-[0_0_0_1px_rgba(20,115,255,0.18)]"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-black text-white">
          {new Date(`${date}T00:00:00`).getDate()}
        </span>
        {sameCalendarDay(date, toISODate(nowInSaoPaulo())) && (
          <span className="rounded-full bg-[rgba(34,211,238,0.14)] px-2 py-0.5 text-[10px] font-bold text-[#b6f3ff]">
            Hoje
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {events.slice(0, compact ? 3 : 5).map((event) => (
          <span
            key={event.id}
            className={cn(
              "block truncate rounded-full border px-2 py-1 text-[11px] font-semibold",
              eventTone(event.type)
            )}
          >
            {event.title}
          </span>
        ))}
        {events.length > (compact ? 3 : 5) && (
          <span className="block text-xs font-semibold text-[var(--muted)]">
            +{events.length - (compact ? 3 : 5)} eventos
          </span>
        )}
      </div>
    </button>
  );
}

function DayAgenda({ events }: { events: FinancialEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-5 text-sm text-[var(--muted)]">
        Nenhum evento financeiro para este dia.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const Icon = eventIcon(event.type);
        return (
          <article
            key={event.id}
            className="rounded-2xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.03)] p-4"
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-2xl border",
                  eventTone(event.type)
                )}
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{event.title}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {eventTypeLabel(event.type)}
                      {event.account_name ? ` · ${event.account_name}` : ""}
                    </p>
                  </div>
                  <Badge variant={statusBadge(event.status)}>
                    {statusLabel(event.status)}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="text-[var(--muted)]">
                    {formatDate(event.date)}
                  </span>
                  <strong className="text-white">
                    {event.amount_cents > 0
                      ? formatCurrency(event.amount_cents)
                      : "Sem valor"}
                  </strong>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  tone: "success" | "danger" | "warning";
}) {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <Icon
          className={cn(
            "size-6",
            tone === "success" && "text-[var(--success)]",
            tone === "danger" && "text-[var(--danger)]",
            tone === "warning" && "text-[var(--warning)]"
          )}
        />
        <CalendarCheck className="size-4 text-[var(--muted-foreground)]" />
      </div>
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

function buildFinancialEvents({
  accounts,
  creditCards,
  debts,
  months,
  subscriptions,
  transactions,
}: Pick<ReturnType<typeof useFinance>, "accounts" | "creditCards" | "debts" | "subscriptions" | "transactions"> & {
  months: string[];
}): FinancialEvent[] {
  const accountName = (id: string | null) =>
    id ? accounts.find((account) => account.id === id)?.name : undefined;

  const transactionEvents: FinancialEvent[] = transactions
    .filter((transaction) => transaction.due_date || transaction.type === "income")
    .map((transaction) => {
      const date = transaction.due_date ?? transaction.date;
      return {
        id: `transaction-${transaction.id}`,
        type: transaction.type === "income" ? "income" : "bill",
        title: transaction.description,
        amount_cents: transaction.amount_cents,
        date,
        status: computeStatusFromDates(
          transaction.status,
          transaction.due_date ?? transaction.date,
          transaction.payment_date
        ),
        account_name: accountName(transaction.account_id),
        source_id: transaction.id,
      };
    });

  const cardEvents: FinancialEvent[] = creditCards
    .filter((card) => card.is_active)
    .flatMap((card) =>
      months.flatMap((month) => [
        {
          id: `card-closing-${card.id}-${month}`,
          type: "card_closing" as const,
          title: `Fechamento ${card.name}`,
          amount_cents: 0,
          date: dateForDay(month, card.closing_day),
          status: computeStatusFromDates("scheduled", dateForDay(month, card.closing_day), null),
          category: "Cartão de crédito",
          source_id: card.id,
        },
        {
          id: `card-due-${card.id}-${month}`,
          type: "card_due" as const,
          title: `Vencimento ${card.name}`,
          amount_cents: Math.max(0, card.credit_limit_cents - card.available_limit_cents),
          date: dateForDay(month, card.due_day),
          status: computeStatusFromDates("pending", dateForDay(month, card.due_day), null),
          category: "Cartão de crédito",
          source_id: card.id,
        },
      ])
    );

  const debtEvents: FinancialEvent[] = debts
    .filter((debt) => debt.status === "active" || debt.status === "overdue")
    .flatMap((debt) =>
      months.map((month) => {
        const date = dateForDay(month, debt.due_day);
        return {
          id: `debt-${debt.id}-${month}`,
          type: "debt_installment" as const,
          title: `Parcela ${debt.name}`,
          amount_cents: debt.installment_amount_cents,
          date,
          status: computeStatusFromDates(debt.status === "overdue" ? "overdue" : "pending", date, null),
          category: debt.creditor,
          source_id: debt.id,
        };
      })
    );

  const subscriptionEvents: FinancialEvent[] = subscriptions
    .filter((subscription) => subscription.is_active)
    .flatMap((subscription) =>
      months.map((month) => {
        const date = dateForDay(month, subscription.billing_day);
        return {
          id: `subscription-${subscription.id}-${month}`,
          type: "subscription" as const,
          title: subscription.name,
          amount_cents: subscription.amount_cents,
          date,
          status: computeStatusFromDates("pending", date, null),
          account_name: accountName(subscription.account_id),
          source_id: subscription.id,
        };
      })
    );

  return [
    ...transactionEvents,
    ...cardEvents,
    ...debtEvents,
    ...subscriptionEvents,
  ].sort(sortEvents);
}

function buildMonthGrid(month: string) {
  const first = parseDate(`${month}-01`);
  const start = startOfWeek(first, { weekStartsOn: 1 });
  return Array.from({ length: 42 }, (_, index) => toISODate(addDays(start, index)));
}

function buildWeekDays(date: string) {
  const start = startOfWeek(parseDate(date), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => toISODate(addDays(start, index)));
}

function eventsForDate(events: FinancialEvent[], date: string) {
  return events.filter((event) => sameCalendarDay(event.date, date)).sort(sortEvents);
}

function sortEvents(a: FinancialEvent, b: FinancialEvent) {
  return a.date.localeCompare(b.date) || eventTypeLabel(a.type).localeCompare(eventTypeLabel(b.type));
}

function dateForDay(month: string, day: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function eventIcon(type: FinancialEventType) {
  const icons = {
    bill: ReceiptText,
    debt_installment: Landmark,
    subscription: Repeat,
    income: TrendingUp,
    card_closing: CreditCard,
    card_due: CreditCard,
    goal_contribution: Bell,
  };
  return icons[type];
}

function eventTypeLabel(type: FinancialEventType) {
  const labels = {
    bill: "Conta a pagar",
    debt_installment: "Parcela de dívida",
    subscription: "Renovação de assinatura",
    income: "Receita esperada",
    card_closing: "Fechamento do cartão",
    card_due: "Vencimento do cartão",
    goal_contribution: "Aporte em meta",
  };
  return labels[type];
}

function statusLabel(status: FinancialEvent["status"]) {
  const labels = {
    paid: "Pago",
    pending: "Pendente",
    due_today: "Vence hoje",
    overdue: "Atrasado",
    scheduled: "Agendado",
  };
  return labels[status];
}

function statusBadge(status: FinancialEvent["status"]) {
  if (status === "paid") return "success";
  if (status === "overdue") return "danger";
  if (status === "due_today") return "warning";
  return "muted";
}

function eventTone(type: FinancialEventType) {
  if (type === "income") {
    return "border-[rgba(20,217,144,0.36)] bg-[rgba(20,217,144,0.12)] text-[#a8f7d8]";
  }
  if (type === "card_closing" || type === "card_due") {
    return "border-[rgba(34,211,238,0.36)] bg-[rgba(34,211,238,0.12)] text-[#b6f3ff]";
  }
  if (type === "subscription") {
    return "border-[rgba(139,92,246,0.36)] bg-[rgba(139,92,246,0.12)] text-[#ddd6fe]";
  }
  if (type === "debt_installment") {
    return "border-[rgba(245,158,11,0.36)] bg-[rgba(245,158,11,0.12)] text-[#fde3a3]";
  }
  return "border-[rgba(255,90,111,0.36)] bg-[rgba(255,90,111,0.12)] text-[#ffc2ca]";
}

const weekLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
