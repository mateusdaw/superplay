"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isDemoMode = !supabase;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!supabase) {
      router.push("/");
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-[-0.04em] text-white">
          Entrar na sua conta
        </h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">
          Acesse seu painel financeiro pessoal com segurança.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required={!isDemoMode}
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-[#8bbcff] transition-colors hover:text-white"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required={!isDemoMode}
          />
        </div>

        {error && (
          <p className="rounded-2xl border border-[rgba(255,90,111,0.42)] bg-[rgba(255,90,111,0.12)] px-4 py-3 text-sm font-semibold text-[#ffc2ca]">
            {error}
          </p>
        )}

        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Entrar
          <ArrowRight className="size-4" />
        </Button>

        {isDemoMode && (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Entrar em modo demonstração
          </Button>
        )}
      </form>
    </div>
  );
}
