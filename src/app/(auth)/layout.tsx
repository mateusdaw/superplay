import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-10 size-72 -translate-x-1/2 rounded-full bg-[rgba(20,115,255,0.18)] blur-3xl" />
        <div className="absolute bottom-10 right-10 size-72 rounded-full bg-[rgba(34,211,238,0.08)] blur-3xl" />
      </div>
      <section className="glass-card w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-3xl border border-[rgba(20,115,255,0.5)] bg-[rgba(20,115,255,0.18)] text-2xl font-black text-white shadow-[0_0_40px_rgba(20,115,255,0.28)]">
            F
          </div>
          <p className="glow-text text-2xl font-black tracking-[-0.05em] text-white">
            Finanse
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
            Seu cockpit financeiro premium
          </p>
        </div>
        {children}
      </section>
    </main>
  );
}
