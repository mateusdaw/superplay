"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Plus,
  Search,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { greetingForNow, daysUntil, formatMonthYear, shiftMonth } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useFinance } from "@/contexts/finance-context";
import { createClient } from "@/lib/supabase/client";
import type { Transaction } from "@/types/database";

type HeaderProps = {
  onOpenCommand: () => void;
  onOpenQuickTransaction: () => void;
  onOpenMobileNav: () => void;
};

export function Header({
  onOpenCommand,
  onOpenQuickTransaction,
  onOpenMobileNav,
}: HeaderProps) {
  const router = useRouter();
  const { profile, profileName, selectedMonth, setSelectedMonth, transactions } =
    useFinance();
  const notifications = getNotificationCounts(transactions);
  const initials = getInitials(profile.full_name || profileName);

  async function handleLogout() {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--card-border)] bg-[rgba(5,8,22,0.72)] px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onOpenMobileNav}
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </Button>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--muted)]">
              {formatMonthYear(`${selectedMonth}-01`)}
            </p>
            <h1 className="truncate text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
              {greetingForNow(profileName)}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.68)] p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl"
              onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-32 px-3 text-center text-sm font-bold text-white">
              {formatMonthYear(`${selectedMonth}-01`)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl"
              onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="hidden min-w-52 justify-between sm:inline-flex"
            onClick={onOpenCommand}
          >
            <span className="inline-flex items-center gap-2 text-[var(--muted)]">
              <Search className="size-4" />
              Buscar
            </span>
            <kbd className="rounded-lg border border-[var(--card-border)] bg-black/20 px-2 py-1 text-[10px] font-black text-[var(--muted)]">
              ⌘K
            </kbd>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={onOpenCommand}
            aria-label="Abrir busca"
          >
            <Search className="size-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notificações"
              >
                <Bell className="size-5" />
                {notifications.total > 0 && (
                  <span className="absolute right-2 top-2 size-2.5 rounded-full bg-[var(--danger)] shadow-[0_0_18px_rgba(255,90,111,0.8)]" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Alertas financeiros</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <NotificationItem
                label="Vencidos"
                value={notifications.overdue}
                tone="danger"
              />
              <NotificationItem
                label="Próximos 7 dias"
                value={notifications.upcoming}
                tone="primary"
              />
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            className="hidden sm:inline-flex"
            onClick={onOpenQuickTransaction}
          >
            <Plus className="size-4" />
            Adicionar transação
          </Button>
          <Button
            type="button"
            size="icon"
            className="sm:hidden"
            onClick={onOpenQuickTransaction}
            aria-label="Adicionar transação"
          >
            <Plus className="size-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                aria-label="Menu do usuário"
              >
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <span className="block truncate text-sm text-white">
                  {profile.full_name}
                </span>
                <span className="block truncate text-xs font-medium text-[var(--muted)]">
                  {profile.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/configuracoes">
                  <User className="size-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function NotificationItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "primary";
}) {
  return (
    <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm">
      <span className="font-semibold text-[var(--muted)]">{label}</span>
      <span
        className={cn(
          "rounded-full px-2 py-1 text-xs font-black",
          tone === "danger"
            ? "bg-[rgba(255,90,111,0.16)] text-[#ffc2ca]"
            : "bg-[rgba(20,115,255,0.16)] text-[#cfe2ff]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function getNotificationCounts(transactions: Transaction[]) {
  return transactions.reduce(
    (counts, transaction) => {
      if (transaction.status === "paid") return counts;

      const referenceDate = transaction.due_date ?? transaction.date;
      const days = daysUntil(referenceDate);
      if (transaction.status === "overdue" || days < 0) counts.overdue += 1;
      else if (days <= 7) counts.upcoming += 1;

      counts.total = counts.overdue + counts.upcoming;
      return counts;
    },
    { overdue: 0, upcoming: 0, total: 0 }
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
