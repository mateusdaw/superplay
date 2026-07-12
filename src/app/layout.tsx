import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FinanceProvider } from "@/contexts/finance-context";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finanse — Controle Financeiro Pessoal",
  description:
    "Dashboard premium para organizar receitas, despesas, cartões, dívidas, metas e orçamentos pessoais no Brasil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TooltipProvider delayDuration={150}>
          <FinanceProvider>
            {children}
            <Toaster theme="dark" position="top-right" richColors closeButton />
          </FinanceProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
