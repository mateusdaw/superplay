# Finanse

Dashboard brasileiro de finanças pessoais para acompanhar receitas, despesas,
cartões, dívidas, assinaturas, orçamentos, metas e patrimônio em uma experiência
premium, responsiva e pronta para modo demo.

## Visão geral

O Finanse foi criado para uso no Brasil, com valores em BRL, datas em pt-BR e
fuso `America/Sao_Paulo`. A aplicação funciona em modo demonstração sem
Supabase, mas também inclui schema SQL com RLS para uso em produção.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + Radix UI (shadcn-style)
- Framer Motion
- Recharts
- React Three Fiber / Three.js / Drei (globo digital)
- React Hook Form + Zod
- Supabase (Auth, PostgreSQL, RLS)
- date-fns / date-fns-tz (`America/Sao_Paulo`)
- Lucide React
- cmdk (command palette) + Sonner (toasts)

## Funcionalidades

- Visão geral com saldo, receitas, despesas, patrimônio e fluxo de caixa.
- Transações com status, vencimentos, métodos de pagamento e categorias.
- Gastos fixos, assinaturas e próximas contas.
- Dívidas com parcelas, saldo devedor e previsão de quitação.
- Cartões de crédito com fechamento, vencimento e uso de limite.
- Contas bancárias, metas e orçamentos mensais.
- Relatórios com filtros por mês/período e exportação CSV.
- Calendário financeiro com visões de mês, semana e dia.
- Configurações com preferências, modo demo e reset dos dados locais.

## Setup local

```bash
git clone <repo-url>
cd <repo>
npm i
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`.

## Modo demo

O app funciona sem Supabase quando:

- `NEXT_PUBLIC_DEMO_MODE=true`; ou
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão vazios.

Os dados demo são gerados localmente e podem ser restaurados em
**Configurações → Resetar dados demo**.

## Configuração Supabase

1. Crie um projeto no Supabase.
2. Execute o arquivo `supabase/schema.sql` no SQL Editor.
3. Habilite autenticação por e-mail.
4. Desabilite cadastro público caso o produto seja de acesso controlado.
5. Configure as variáveis em `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=false
```

## Seed de dados

Para popular dados de demonstração no Supabase, use a função SQL
`seed_demo_data` criada pelo schema. Em modo local/demo, use o botão de reset em
**Configurações** para recriar o dataset de exemplo.

## Scripts

```bash
npm run dev    # desenvolvimento
npm run build  # build de produção
npm run start  # servidor Next em produção
npm run lint   # ESLint
```

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente usadas no Supabase.
3. Use o comando de build padrão:

```bash
npm run build
```

4. Publique com `NEXT_PUBLIC_DEMO_MODE=false` para produção conectada ao
   Supabase, ou `true` para demonstração pública sem backend.

## Verificação de build de produção

Antes de publicar:

```bash
npm run lint
npm run build
npm run start
```

Depois, valide:

- Login por e-mail.
- Carregamento do dashboard.
- RLS impedindo leitura/escrita entre usuários.
- Valores monetários preservados em centavos.
- Fluxos de reset/seed apenas onde forem esperados.

## Segurança

- Use Row Level Security no Supabase.
- Armazene valores monetários como inteiros em centavos.
- Nunca armazene número completo de cartão; use apenas identificadores como
  bandeira e últimos quatro dígitos.
- Não exponha `SUPABASE_SERVICE_ROLE_KEY` no cliente.
- Desabilite cadastro público quando o produto exigir convite ou aprovação.

## Estrutura de pastas

```text
src/app/                 Rotas App Router, layouts e páginas
src/app/(dashboard)/     Área autenticada/demo do dashboard
src/components/          Componentes de UI, layout, charts e dashboard
src/contexts/            Contexto financeiro e estado demo
src/lib/                 Cálculos, datas, dinheiro, demo store e utilitários
src/types/               Tipos compartilhados do domínio
supabase/schema.sql      Schema, RLS e funções SQL
public/                  Assets estáticos
```

## English summary

Finanse is a Brazilian personal finance dashboard built with Next.js, React,
TypeScript, Tailwind, Recharts and Supabase. It supports a no-backend demo mode
and a production Supabase setup with RLS, BRL cents-based amounts, reports,
calendar, budgets, debts, cards and goals.
