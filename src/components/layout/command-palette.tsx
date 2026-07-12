"use client";

import { useEffect, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  ArrowRight,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sidebarNavItems } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTransaction: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  onCreateTransaction,
}: CommandPaletteProps) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  function runCommand(callback: () => void) {
    onOpenChange(false);
    callback();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Paleta de comandos</DialogTitle>
          <DialogDescription>
            Busque páginas ou execute ações rápidas no Finanse.
          </DialogDescription>
        </DialogHeader>

        <Command className="bg-transparent text-[var(--foreground)]">
          <div className="flex items-center gap-3 border-b border-[var(--card-border)] px-5 py-4">
            <Search className="size-5 text-[var(--muted)]" />
            <Command.Input
              autoFocus
              placeholder="Busque páginas, relatórios ou ações..."
              className="h-11 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-[var(--muted-foreground)]"
            />
          </div>

          <Command.List className="max-h-[420px] overflow-y-auto p-3 scrollbar-thin">
            <Command.Empty className="px-3 py-8 text-center text-sm font-semibold text-[var(--muted)]">
              Nenhum resultado encontrado.
            </Command.Empty>

            <Command.Group
              heading="Ações rápidas"
              className="cmdk-group"
            >
              <CommandItem
                icon={Plus}
                label="Nova transação"
                description="Adicionar receita ou despesa"
                onSelect={() => runCommand(onCreateTransaction)}
              />
              <CommandItem
                icon={Sparkles}
                label="Revisar alertas"
                description="Abrir calendário financeiro"
                onSelect={() => runCommand(() => router.push("/calendario"))}
              />
              <CommandItem
                icon={Settings}
                label="Preferências"
                description="Ajustar perfil, notificações e tema"
                onSelect={() => runCommand(() => router.push("/configuracoes"))}
              />
            </Command.Group>

            <Command.Group heading="Páginas" className="cmdk-group">
              {sidebarNavItems.map((item) => (
                <CommandItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  description={item.href}
                  onSelect={() => runCommand(() => router.push(item.href))}
                />
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandItem({
  icon: Icon,
  label,
  description,
  onSelect,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={`${label} ${description}`}
      onSelect={onSelect}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 outline-none transition-colors",
        "aria-selected:bg-[rgba(20,115,255,0.16)] aria-selected:text-white"
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.04)] text-[var(--muted)] group-aria-selected:text-[#8bbcff]">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">{label}</span>
        <span className="block truncate text-xs font-semibold text-[var(--muted)]">
          {description}
        </span>
      </span>
      <ArrowRight className="size-4 text-[var(--muted-foreground)] opacity-0 transition-opacity group-aria-selected:opacity-100" />
    </Command.Item>
  );
}
