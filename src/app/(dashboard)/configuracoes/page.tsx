"use client";

import { toast } from "sonner";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronsLeftRight,
  Database,
  Globe2,
  Mail,
  RotateCcw,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFinance } from "@/contexts/finance-context";

export default function SettingsPage() {
  const {
    isDemoMode,
    preferences,
    profile,
    resetDemo,
    updatePreferences,
  } = useFinance();

  const handleResetDemo = () => {
    resetDemo();
    toast.success("Dados demonstrativos restaurados");
  };

  return (
    <div className="space-y-8">
      <section className="glass-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="cyan">Configurações</Badge>
              {isDemoMode && <Badge variant="warning">Modo demo ativo</Badge>}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Preferências da conta e ambiente
            </h1>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Ajuste a experiência local, revise dados de perfil e veja o que
              falta para conectar o Finanse a um Supabase de produção.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="danger">
                <RotateCcw className="size-4" />
                Resetar dados demo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restaurar dados demonstrativos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação substitui os dados locais do modo demo pelo conjunto
                  inicial de exemplo. Alterações feitas nesta sessão serão perdidas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetDemo}>
                  Sim, resetar demo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="glass-card p-5">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-3xl border border-[rgba(20,115,255,0.42)] bg-[rgba(20,115,255,0.16)] text-2xl font-black text-white">
              {initials(profile.full_name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
              <p className="text-sm text-[var(--muted)]">Perfil atual</p>
            </div>
          </div>

          <div className="space-y-3">
            <InfoRow icon={User} label="Nome" value={profile.full_name} />
            <InfoRow icon={Mail} label="E-mail" value={profile.email} />
            <InfoRow
              icon={ShieldCheck}
              label="Status"
              value={isDemoMode ? "Ambiente demonstrativo" : "Supabase conectado"}
            />
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">Preferências</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              As preferências são persistidas no armazenamento demo ou no perfil
              quando o backend estiver conectado.
            </p>
          </div>

          <div className="divide-y divide-[var(--card-border)]">
            <PreferenceSwitch
              icon={Bell}
              title="Notificações"
              description="Lembretes de vencimentos, assinaturas e dívidas."
              checked={preferences.notifications_enabled}
              onCheckedChange={(checked) =>
                updatePreferences({ notifications_enabled: checked })
              }
            />
            <PreferenceSwitch
              icon={ChevronsLeftRight}
              title="Sidebar recolhida"
              description="Mantém a navegação lateral em modo compacto."
              checked={preferences.sidebar_collapsed}
              onCheckedChange={(checked) =>
                updatePreferences({ sidebar_collapsed: checked })
              }
            />
            <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.04)] text-[var(--cyan)]">
                  <CalendarDays className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold text-white">Início do mês financeiro</h3>
                  <p className="text-sm leading-6 text-[var(--muted)]">
                    Dia usado para ciclos de planejamento e alertas.
                  </p>
                </div>
              </div>
              <Select
                value={String(preferences.month_start_day)}
                onValueChange={(value) =>
                  updatePreferences({ month_start_day: Number(value) })
                }
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 5, 10, 15, 20, 25].map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      Dia {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="glass-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <Globe2 className="size-6 text-[var(--cyan)]" />
            <div>
              <h2 className="text-xl font-bold text-white">Localização</h2>
              <p className="text-sm text-[var(--muted)]">Padrões usados no app.</p>
            </div>
          </div>
          <div className="space-y-3">
            <InfoPill label="Locale" value={profile.locale || "pt-BR"} />
            <InfoPill label="Moeda" value={profile.currency || "BRL"} />
            <InfoPill
              label="Fuso horário"
              value={profile.timezone || "America/Sao_Paulo"}
            />
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <Database className="size-6 text-[var(--warning)]" />
            <div>
              <h2 className="text-xl font-bold text-white">Supabase</h2>
              <p className="text-sm text-[var(--muted)]">Preparação para produção.</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Em produção, configure as variáveis públicas do Supabase, aplique o
            arquivo <code className="text-white">supabase/schema.sql</code>,
            mantenha RLS ativo e desabilite cadastro público se o acesso for
            controlado.
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <CheckCircle2 className="size-6 text-[var(--success)]" />
            <div>
              <h2 className="text-xl font-bold text-white">Integrações</h2>
              <p className="text-sm text-[var(--muted)]">Recursos planejados.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.03)] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-bold text-white">Login com Google</span>
              <Badge variant="muted">Futuro</Badge>
            </div>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Integração futura via provedor OAuth do Supabase. Nenhum login
              social simulado está ativo nesta versão.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function PreferenceSwitch({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <div className="flex gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.04)] text-[var(--cyan)]">
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="font-bold text-white">{title}</h3>
          <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.03)] p-4">
      <Icon className="size-5 text-[var(--cyan)]" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          {label}
        </p>
        <p className="truncate font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <span className="text-sm font-semibold text-[var(--muted)]">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
