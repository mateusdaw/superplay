"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabase) {
      setMessage(
        "O modo demonstração está ativo. Volte ao login e entre sem recuperação de senha."
      );
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("Enviamos um link de recuperação para o seu e-mail.");
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
          Recuperar senha
        </h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">
          Informe seu e-mail para receber um link de redefinição.
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
            <Mail className="size-4" />
          )}
          Enviar link
        </Button>
      </form>
    </div>
  );
}
