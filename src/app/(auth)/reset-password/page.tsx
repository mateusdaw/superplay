"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabase) {
      router.push("/login");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Senha atualizada com sucesso. Redirecionando para o login...");
    setTimeout(() => router.push("/login"), 900);
  }

  return (
    <div>
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Voltar ao login
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-[-0.04em] text-white">
          Definir nova senha
        </h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">
          Escolha uma senha forte para proteger seu dashboard.
        </p>
      </div>

      {!supabase && (
        <p className="mb-4 rounded-2xl border border-[var(--card-border)] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[var(--muted)]">
          Supabase não está configurado. Use o modo demonstração no login.
        </p>
      )}

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required={Boolean(supabase)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a nova senha"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required={Boolean(supabase)}
          />
        </div>

        {message && (
          <p className="rounded-2xl border border-[rgba(20,217,144,0.42)] bg-[rgba(20,217,144,0.12)] px-4 py-3 text-sm font-semibold text-[#a8f7d8]">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-2xl border border-[rgba(255,90,111,0.42)] bg-[rgba(255,90,111,0.12)] px-4 py-3 text-sm font-semibold text-[#ffc2ca]">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Atualizar senha
        </Button>
      </form>
    </div>
  );
}
