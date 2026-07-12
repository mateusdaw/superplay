"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Landmark,
  PieChart,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const sidebarNavItems: SidebarNavItem[] = [
  { label: "Visão Geral", href: "/", icon: LayoutDashboard },
  { label: "Transações", href: "/transacoes", icon: ArrowLeftRight },
  { label: "Gastos Fixos", href: "/gastos-fixos", icon: Banknote },
  { label: "Dívidas", href: "/dividas", icon: BadgeDollarSign },
  { label: "Cartões", href: "/cartoes", icon: CreditCard },
  { label: "Contas Bancárias", href: "/contas", icon: Landmark },
  { label: "Assinaturas", href: "/assinaturas", icon: Bell },
  { label: "Orçamentos", href: "/orcamentos", icon: PieChart },
  { label: "Metas", href: "/metas", icon: Target },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Calendário Financeiro", href: "/calendario", icon: CalendarDays },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

type SidebarProps = {
  collapsed?: boolean;
  mobile?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNavigate?: () => void;
  className?: string;
};

export function Sidebar({
  collapsed = false,
  mobile = false,
  onCollapsedChange,
  onNavigate,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const compact = collapsed && !mobile;

  return (
    <motion.aside
      animate={{ width: compact ? 84 : 280 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className={cn(
        "glass-card flex h-full flex-col overflow-hidden rounded-none border-y-0 border-l-0",
        !mobile && "fixed inset-y-0 left-0 z-40 hidden lg:flex",
        mobile && "w-full border-0 bg-transparent shadow-none",
        className
      )}
    >
      <div className="flex h-20 shrink-0 items-center justify-between gap-3 px-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="group flex min-w-0 items-center gap-3"
          aria-label="Finanse"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(20,115,255,0.5)] bg-[rgba(20,115,255,0.18)] text-lg font-black text-white shadow-[0_0_30px_rgba(20,115,255,0.28)]">
            F
          </span>
          {!compact && (
            <span className="min-w-0">
              <span className="glow-text block truncate text-xl font-black tracking-[-0.04em] text-white">
                Finanse
              </span>
              <span className="block truncate text-xs font-semibold text-[var(--muted)]">
                Controle financeiro
              </span>
            </span>
          )}
        </Link>

        {!mobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl"
            onClick={() => onCollapsedChange?.(!collapsed)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </Button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 pb-5">
        <nav className="space-y-1.5">
          {sidebarNavItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
              compact={compact}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </ScrollArea>
    </motion.aside>
  );
}

function SidebarLink({
  item,
  active,
  compact,
  onNavigate,
}: {
  item: SidebarNavItem;
  active: boolean;
  compact: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-[var(--muted)] transition-all duration-200",
        "hover:bg-[rgba(255,255,255,0.06)] hover:text-white",
        active &&
          "bg-[rgba(20,115,255,0.18)] text-white shadow-[inset_0_0_0_1px_rgba(20,115,255,0.32),0_12px_30px_rgba(20,115,255,0.12)]",
        compact && "justify-center px-0"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[var(--primary)] shadow-[0_0_20px_rgba(20,115,255,0.9)]" />
      )}
      <Icon
        className={cn(
          "size-5 shrink-0 transition-colors",
          active ? "text-[#65a3ff]" : "text-[var(--muted)] group-hover:text-white"
        )}
      />
      {!compact && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!compact) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
