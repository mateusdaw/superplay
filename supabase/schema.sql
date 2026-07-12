create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  avatar_url text,
  timezone text not null default 'America/Sao_Paulo',
  locale text not null default 'pt-BR',
  currency char(3) not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_currency_check check (currency = upper(currency)),
  constraint profiles_locale_check check (locale <> ''),
  constraint profiles_timezone_check check (timezone <> '')
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution text not null default '',
  type text not null,
  initial_balance_cents bigint not null default 0,
  current_balance_cents bigint not null default 0,
  color text not null default '#1473FF',
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_name_check check (length(trim(name)) > 0),
  constraint accounts_type_check check (type in ('checking', 'savings', 'wallet', 'cash', 'investment'))
);

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank text not null default '',
  brand text not null default 'other',
  credit_limit_cents bigint not null default 0,
  available_limit_cents bigint not null default 0,
  closing_day integer not null,
  due_day integer not null,
  color text not null default '#1473FF',
  last_four char(4) not null default '0000',
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_cards_name_check check (length(trim(name)) > 0),
  constraint credit_cards_brand_check check (brand in ('visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other')),
  constraint credit_cards_limit_check check (credit_limit_cents >= 0 and available_limit_cents >= 0),
  constraint credit_cards_day_check check (closing_day between 1 and 31 and due_day between 1 and 31),
  constraint credit_cards_last_four_check check (last_four ~ '^[0-9]{4}$')
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default 'circle',
  color text not null default '#1473FF',
  type text not null default 'expense',
  parent_id uuid references public.categories(id) on delete set null,
  is_system boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_check check (length(trim(name)) > 0),
  constraint categories_type_check check (type in ('income', 'expense', 'both'))
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount_cents bigint not null,
  type text not null,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.categories(id) on delete set null,
  date date not null,
  due_date date,
  payment_date date,
  account_id uuid references public.accounts(id) on delete set null,
  credit_card_id uuid references public.credit_cards(id) on delete set null,
  payment_method text,
  status text not null default 'pending',
  notes text,
  attachment_url text,
  is_recurring boolean not null default false,
  installment_total integer,
  installment_current integer,
  parent_transaction_id uuid references public.transactions(id) on delete set null,
  tags text[] not null default '{}',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_description_check check (length(trim(description)) > 0),
  constraint transactions_amount_check check (amount_cents > 0),
  constraint transactions_type_check check (type in ('income', 'expense')),
  constraint transactions_payment_method_check check (
    payment_method is null or payment_method in ('pix', 'debit', 'credit', 'boleto', 'transfer', 'cash', 'other')
  ),
  constraint transactions_status_check check (status in ('paid', 'pending', 'due_today', 'overdue', 'scheduled')),
  constraint transactions_installments_check check (
    (installment_total is null and installment_current is null)
    or (
      installment_total is not null
      and installment_current is not null
      and installment_total > 0
      and installment_current between 1 and installment_total
    )
  )
);

create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount_cents bigint not null,
  category_id uuid references public.categories(id) on delete set null,
  due_day integer not null,
  recurrence text not null default 'monthly',
  start_date date not null,
  end_date date,
  auto_pay boolean not null default false,
  account_id uuid references public.accounts(id) on delete set null,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_expenses_name_check check (length(trim(name)) > 0),
  constraint recurring_expenses_amount_check check (amount_cents > 0),
  constraint recurring_expenses_due_day_check check (due_day between 1 and 31),
  constraint recurring_expenses_recurrence_check check (recurrence in ('monthly', 'weekly', 'yearly', 'biweekly', 'custom')),
  constraint recurring_expenses_dates_check check (end_date is null or end_date >= start_date)
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  creditor text not null,
  original_amount_cents bigint not null,
  current_balance_cents bigint not null,
  interest_rate_annual numeric(7,4) not null default 0,
  installment_amount_cents bigint not null default 0,
  total_installments integer not null default 1,
  paid_installments integer not null default 0,
  due_day integer not null,
  start_date date not null,
  notes text,
  status text not null default 'active',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debts_name_check check (length(trim(name)) > 0),
  constraint debts_creditor_check check (length(trim(creditor)) > 0),
  constraint debts_money_check check (
    original_amount_cents > 0
    and current_balance_cents >= 0
    and installment_amount_cents >= 0
  ),
  constraint debts_rate_check check (interest_rate_annual >= 0),
  constraint debts_installments_check check (
    total_installments > 0
    and paid_installments >= 0
    and paid_installments <= total_installments
  ),
  constraint debts_due_day_check check (due_day between 1 and 31),
  constraint debts_status_check check (status in ('active', 'paid', 'overdue', 'renegotiated'))
);

create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null references public.debts(id) on delete cascade,
  amount_cents bigint not null,
  paid_at date not null,
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debt_payments_amount_check check (amount_cents > 0)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount_cents bigint not null,
  category_id uuid references public.categories(id) on delete set null,
  billing_day integer not null,
  recurrence text not null default 'monthly',
  next_billing_date date not null,
  account_id uuid references public.accounts(id) on delete set null,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_name_check check (length(trim(name)) > 0),
  constraint subscriptions_amount_check check (amount_cents > 0),
  constraint subscriptions_billing_day_check check (billing_day between 1 and 31),
  constraint subscriptions_recurrence_check check (recurrence in ('monthly', 'weekly', 'yearly', 'biweekly', 'custom'))
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month date not null,
  limit_cents bigint not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_limit_check check (limit_cents >= 0),
  constraint budgets_month_check check (extract(day from month) = 1),
  constraint budgets_unique_month_category unique (user_id, category_id, month)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount_cents bigint not null,
  current_amount_cents bigint not null default 0,
  target_date date not null,
  monthly_contribution_cents bigint not null default 0,
  priority text not null default 'medium',
  icon text not null default 'target',
  color text not null default '#1473FF',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_name_check check (length(trim(name)) > 0),
  constraint goals_money_check check (
    target_amount_cents > 0
    and current_amount_cents >= 0
    and current_amount_cents <= target_amount_cents
    and monthly_contribution_cents >= 0
  ),
  constraint goals_priority_check check (priority in ('low', 'medium', 'high'))
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  amount_cents bigint not null,
  contributed_at date not null,
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_contributions_amount_check check (amount_cents > 0)
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attachments_file_name_check check (length(trim(file_name)) > 0),
  constraint attachments_file_path_check check (length(trim(file_path)) > 0),
  constraint attachments_size_check check (size_bytes > 0)
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  sidebar_collapsed boolean not null default false,
  demo_data_enabled boolean not null default false,
  theme text not null default 'dark',
  month_start_day integer not null default 1,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_theme_check check (theme in ('dark', 'light', 'system')),
  constraint user_preferences_month_start_day_check check (month_start_day between 1 and 28)
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists accounts_user_active_idx on public.accounts(user_id, is_active);
create index if not exists credit_cards_user_id_idx on public.credit_cards(user_id);
create index if not exists credit_cards_user_active_idx on public.credit_cards(user_id, is_active);
create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists categories_user_type_idx on public.categories(user_id, type);
create index if not exists categories_parent_id_idx on public.categories(parent_id);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_user_date_idx on public.transactions(user_id, date desc);
create index if not exists transactions_user_status_idx on public.transactions(user_id, status);
create index if not exists transactions_user_category_idx on public.transactions(user_id, category_id);
create index if not exists transactions_user_account_idx on public.transactions(user_id, account_id);
create index if not exists transactions_user_credit_card_idx on public.transactions(user_id, credit_card_id);
create index if not exists transactions_due_date_idx on public.transactions(user_id, due_date) where due_date is not null;
create index if not exists transactions_tags_idx on public.transactions using gin(tags);
create index if not exists recurring_expenses_user_id_idx on public.recurring_expenses(user_id);
create index if not exists recurring_expenses_user_active_idx on public.recurring_expenses(user_id, is_active);
create index if not exists debts_user_id_idx on public.debts(user_id);
create index if not exists debts_user_status_idx on public.debts(user_id, status);
create index if not exists debt_payments_user_id_idx on public.debt_payments(user_id);
create index if not exists debt_payments_debt_id_idx on public.debt_payments(debt_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_user_next_billing_idx on public.subscriptions(user_id, next_billing_date);
create index if not exists budgets_user_id_idx on public.budgets(user_id);
create index if not exists budgets_user_month_idx on public.budgets(user_id, month);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goals_user_priority_idx on public.goals(user_id, priority);
create index if not exists goal_contributions_user_id_idx on public.goal_contributions(user_id);
create index if not exists goal_contributions_goal_id_idx on public.goal_contributions(goal_id);
create index if not exists attachments_user_id_idx on public.attachments(user_id);
create index if not exists attachments_transaction_id_idx on public.attachments(transaction_id);
create index if not exists user_preferences_user_id_idx on public.user_preferences(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_accounts_updated_at on public.accounts;
create trigger set_accounts_updated_at before update on public.accounts
for each row execute function public.set_updated_at();

drop trigger if exists set_credit_cards_updated_at on public.credit_cards;
create trigger set_credit_cards_updated_at before update on public.credit_cards
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists set_recurring_expenses_updated_at on public.recurring_expenses;
create trigger set_recurring_expenses_updated_at before update on public.recurring_expenses
for each row execute function public.set_updated_at();

drop trigger if exists set_debts_updated_at on public.debts;
create trigger set_debts_updated_at before update on public.debts
for each row execute function public.set_updated_at();

drop trigger if exists set_debt_payments_updated_at on public.debt_payments;
create trigger set_debt_payments_updated_at before update on public.debt_payments
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at before update on public.budgets
for each row execute function public.set_updated_at();

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at before update on public.goals
for each row execute function public.set_updated_at();

drop trigger if exists set_goal_contributions_updated_at on public.goal_contributions;
create trigger set_goal_contributions_updated_at before update on public.goal_contributions
for each row execute function public.set_updated_at();

drop trigger if exists set_attachments_updated_at on public.attachments;
create trigger set_attachments_updated_at before update on public.attachments
for each row execute function public.set_updated_at();

drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
create trigger set_user_preferences_updated_at before update on public.user_preferences
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.credit_cards enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.attachments enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists accounts_own on public.accounts;
create policy accounts_own on public.accounts for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists credit_cards_own on public.credit_cards;
create policy credit_cards_own on public.credit_cards for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists categories_own on public.categories;
create policy categories_own on public.categories for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists transactions_own on public.transactions;
create policy transactions_own on public.transactions for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists recurring_expenses_own on public.recurring_expenses;
create policy recurring_expenses_own on public.recurring_expenses for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists debts_own on public.debts;
create policy debts_own on public.debts for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists debt_payments_own on public.debt_payments;
create policy debt_payments_own on public.debt_payments for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists subscriptions_own on public.subscriptions;
create policy subscriptions_own on public.subscriptions for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists budgets_own on public.budgets;
create policy budgets_own on public.budgets for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists goals_own on public.goals;
create policy goals_own on public.goals for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists goal_contributions_own on public.goal_contributions;
create policy goal_contributions_own on public.goal_contributions for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists attachments_own on public.attachments;
create policy attachments_own on public.attachments for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists user_preferences_own on public.user_preferences;
create policy user_preferences_own on public.user_preferences for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.delete_demo_data(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Cannot delete demo data for another user.';
  end if;

  delete from public.attachments where user_id = p_user_id and is_demo = true;
  delete from public.goal_contributions where user_id = p_user_id and is_demo = true;
  delete from public.goals where user_id = p_user_id and is_demo = true;
  delete from public.debt_payments where user_id = p_user_id and is_demo = true;
  delete from public.debts where user_id = p_user_id and is_demo = true;
  delete from public.budgets where user_id = p_user_id and is_demo = true;
  delete from public.subscriptions where user_id = p_user_id and is_demo = true;
  delete from public.recurring_expenses where user_id = p_user_id and is_demo = true;
  delete from public.transactions where user_id = p_user_id and is_demo = true;
  delete from public.credit_cards where user_id = p_user_id and is_demo = true;
  delete from public.accounts where user_id = p_user_id and is_demo = true;
  delete from public.categories where user_id = p_user_id and is_demo = true;

  update public.user_preferences
  set demo_data_enabled = false
  where user_id = p_user_id;
end;
$$;

create or replace function public.seed_demo_data(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month date := date_trunc('month', current_date)::date;
  v_checking uuid;
  v_savings uuid;
  v_wallet uuid;
  v_card uuid;
  v_cat_salary uuid;
  v_cat_home uuid;
  v_cat_food uuid;
  v_cat_transport uuid;
  v_cat_leisure uuid;
  v_cat_health uuid;
  v_cat_investment uuid;
  v_goal uuid;
  v_debt uuid;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Cannot seed demo data for another user.';
  end if;

  perform public.delete_demo_data(p_user_id);

  insert into public.accounts (
    user_id, name, institution, type, initial_balance_cents,
    current_balance_cents, color, is_demo
  )
  values
    (p_user_id, 'Conta Corrente Nubank', 'Nubank', 'checking', 420000, 587240, '#8A05BE', true)
  returning id into v_checking;

  insert into public.accounts (
    user_id, name, institution, type, initial_balance_cents,
    current_balance_cents, color, is_demo
  )
  values
    (p_user_id, 'Reserva Itau', 'Itau', 'savings', 850000, 1125000, '#FF7200', true)
  returning id into v_savings;

  insert into public.accounts (
    user_id, name, institution, type, initial_balance_cents,
    current_balance_cents, color, is_demo
  )
  values
    (p_user_id, 'Carteira', 'Dinheiro', 'cash', 35000, 21650, '#22D3EE', true)
  returning id into v_wallet;

  insert into public.credit_cards (
    user_id, name, bank, brand, credit_limit_cents, available_limit_cents,
    closing_day, due_day, color, last_four, is_demo
  )
  values (
    p_user_id, 'Black Mastercard', 'XP', 'mastercard', 1800000, 1264300,
    25, 5, '#111827', '4821', true
  )
  returning id into v_card;

  insert into public.categories (user_id, name, icon, color, type, is_system, is_demo)
  values (p_user_id, 'Salario', 'briefcase-business', '#14D990', 'income', true, true)
  returning id into v_cat_salary;

  insert into public.categories (user_id, name, icon, color, type, is_system, is_demo)
  values (p_user_id, 'Moradia', 'home', '#1473FF', 'expense', true, true)
  returning id into v_cat_home;

  insert into public.categories (user_id, name, icon, color, type, is_system, is_demo)
  values (p_user_id, 'Alimentacao', 'utensils', '#F59E0B', 'expense', true, true)
  returning id into v_cat_food;

  insert into public.categories (user_id, name, icon, color, type, is_system, is_demo)
  values (p_user_id, 'Transporte', 'car', '#22D3EE', 'expense', true, true)
  returning id into v_cat_transport;

  insert into public.categories (user_id, name, icon, color, type, is_system, is_demo)
  values (p_user_id, 'Lazer', 'sparkles', '#A855F7', 'expense', true, true)
  returning id into v_cat_leisure;

  insert into public.categories (user_id, name, icon, color, type, is_system, is_demo)
  values (p_user_id, 'Saude', 'heart-pulse', '#FF5A6F', 'expense', true, true)
  returning id into v_cat_health;

  insert into public.categories (user_id, name, icon, color, type, is_system, is_demo)
  values (p_user_id, 'Investimentos', 'trending-up', '#14D990', 'both', true, true)
  returning id into v_cat_investment;

  insert into public.transactions (
    user_id, description, amount_cents, type, category_id, date,
    payment_date, account_id, credit_card_id, payment_method, status, tags, is_demo
  )
  values
    (p_user_id, 'Salario CLT', 1285000, 'income', v_cat_salary, v_month + 4, v_month + 4, v_checking, null, 'transfer', 'paid', array['renda fixa'], true),
    (p_user_id, 'Rendimento CDB liquido', 8420, 'income', v_cat_investment, v_month + 8, v_month + 8, v_savings, null, 'transfer', 'paid', array['investimentos'], true),
    (p_user_id, 'Aluguel apartamento', 320000, 'expense', v_cat_home, v_month + 5, v_month + 5, v_checking, null, 'pix', 'paid', array['essencial'], true),
    (p_user_id, 'Condominio', 74500, 'expense', v_cat_home, v_month + 10, null, v_checking, null, 'boleto', 'pending', array['moradia'], true),
    (p_user_id, 'Supermercado Zona Sul', 48670, 'expense', v_cat_food, v_month + 11, v_month + 11, null, v_card, 'credit', 'paid', array['mercado'], true),
    (p_user_id, 'Uber e metro', 18940, 'expense', v_cat_transport, v_month + 12, v_month + 12, null, v_card, 'credit', 'paid', array['mobilidade'], true),
    (p_user_id, 'Jantar Vila Madalena', 23680, 'expense', v_cat_leisure, v_month + 14, null, null, v_card, 'credit', 'pending', array['restaurante'], true),
    (p_user_id, 'Consulta dermatologista', 42000, 'expense', v_cat_health, v_month + 20, null, v_checking, null, 'pix', 'scheduled', array['saude'], true);

  insert into public.recurring_expenses (
    user_id, name, amount_cents, category_id, due_day, recurrence,
    start_date, auto_pay, account_id, is_demo
  )
  values
    (p_user_id, 'Internet fibra', 12990, v_cat_home, 12, 'monthly', v_month, true, v_checking, true),
    (p_user_id, 'Academia', 14990, v_cat_health, 8, 'monthly', v_month, false, v_checking, true);

  insert into public.subscriptions (
    user_id, name, amount_cents, category_id, billing_day, recurrence,
    next_billing_date, account_id, is_demo
  )
  values
    (p_user_id, 'Spotify Familiar', 3490, v_cat_leisure, 7, 'monthly', v_month + 7, v_checking, true),
    (p_user_id, 'Netflix Premium', 5590, v_cat_leisure, 18, 'monthly', v_month + 18, v_checking, true),
    (p_user_id, 'Notion Plus', 4990, v_cat_leisure, 22, 'monthly', v_month + 22, v_checking, true);

  insert into public.budgets (user_id, category_id, month, limit_cents, is_demo)
  values
    (p_user_id, v_cat_food, v_month, 180000, true),
    (p_user_id, v_cat_transport, v_month, 65000, true),
    (p_user_id, v_cat_leisure, v_month, 90000, true),
    (p_user_id, v_cat_health, v_month, 70000, true)
  on conflict (user_id, category_id, month) do update
  set limit_cents = excluded.limit_cents, is_demo = true, updated_at = now();

  insert into public.goals (
    user_id, name, target_amount_cents, current_amount_cents,
    target_date, monthly_contribution_cents, priority, icon, color, is_demo
  )
  values (
    p_user_id, 'Reserva de emergencia', 3600000, 1125000,
    (current_date + interval '14 months')::date, 180000, 'high', 'shield-check', '#14D990', true
  )
  returning id into v_goal;

  insert into public.goal_contributions (
    user_id, goal_id, amount_cents, contributed_at, notes, is_demo
  )
  values
    (p_user_id, v_goal, 180000, v_month + 6, 'Aporte mensal automatico', true),
    (p_user_id, v_goal, 50000, v_month + 16, 'Bonus do projeto freelance', true);

  insert into public.debts (
    user_id, name, creditor, original_amount_cents, current_balance_cents,
    interest_rate_annual, installment_amount_cents, total_installments,
    paid_installments, due_day, start_date, notes, status, is_demo
  )
  values (
    p_user_id, 'Financiamento carro', 'Banco BV', 4200000, 3150000,
    0.1490, 126500, 48, 12, 15, (current_date - interval '12 months')::date,
    'Contrato demo com amortizacao mensal.', 'active', true
  )
  returning id into v_debt;

  insert into public.debt_payments (
    user_id, debt_id, amount_cents, paid_at, notes, is_demo
  )
  values
    (p_user_id, v_debt, 126500, v_month + 15, 'Parcela paga no vencimento', true);

  insert into public.attachments (
    user_id, transaction_id, file_name, file_path, mime_type, size_bytes, is_demo
  )
  select
    p_user_id,
    id,
    'recibo-supermercado-demo.pdf',
    'demo/recibos/supermercado.pdf',
    'application/pdf',
    128430,
    true
  from public.transactions
  where user_id = p_user_id
    and is_demo = true
    and description = 'Supermercado Zona Sul'
  limit 1;

  insert into public.user_preferences (user_id, demo_data_enabled)
  values (p_user_id, true)
  on conflict (user_id) do update
  set demo_data_enabled = true, updated_at = now();
end;
$$;
