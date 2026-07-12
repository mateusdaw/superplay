export type AccountType =
  | "checking"
  | "savings"
  | "wallet"
  | "cash"
  | "investment";

export type TransactionType = "income" | "expense";

export type TransactionStatus =
  | "paid"
  | "pending"
  | "due_today"
  | "overdue"
  | "scheduled";

export type PaymentMethod =
  | "pix"
  | "debit"
  | "credit"
  | "boleto"
  | "transfer"
  | "cash"
  | "other";

export type DebtStatus = "active" | "paid" | "overdue" | "renegotiated";

export type Recurrence =
  | "monthly"
  | "weekly"
  | "yearly"
  | "biweekly"
  | "custom";

export type GoalPriority = "low" | "medium" | "high";

export type CardBrand =
  | "visa"
  | "mastercard"
  | "elo"
  | "amex"
  | "hipercard"
  | "other";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  timezone: string;
  locale: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  institution: string;
  type: AccountType;
  initial_balance_cents: number;
  current_balance_cents: number;
  color: string;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  brand: CardBrand;
  credit_limit_cents: number;
  available_limit_cents: number;
  closing_day: number;
  due_day: number;
  color: string;
  last_four: string;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType | "both";
  parent_id: string | null;
  is_system: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount_cents: number;
  type: TransactionType;
  category_id: string | null;
  subcategory_id: string | null;
  date: string;
  due_date: string | null;
  payment_date: string | null;
  account_id: string | null;
  credit_card_id: string | null;
  payment_method: PaymentMethod | null;
  status: TransactionStatus;
  notes: string | null;
  attachment_url: string | null;
  is_recurring: boolean;
  installment_total: number | null;
  installment_current: number | null;
  parent_transaction_id: string | null;
  tags: string[];
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  name: string;
  amount_cents: number;
  category_id: string | null;
  due_day: number;
  recurrence: Recurrence;
  start_date: string;
  end_date: string | null;
  auto_pay: boolean;
  account_id: string | null;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  creditor: string;
  original_amount_cents: number;
  current_balance_cents: number;
  interest_rate_annual: number;
  installment_amount_cents: number;
  total_installments: number;
  paid_installments: number;
  due_day: number;
  start_date: string;
  notes: string | null;
  status: DebtStatus;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  user_id: string;
  debt_id: string;
  amount_cents: number;
  paid_at: string;
  notes: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount_cents: number;
  category_id: string | null;
  billing_day: number;
  recurrence: Recurrence;
  next_billing_date: string;
  account_id: string | null;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  limit_cents: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount_cents: number;
  current_amount_cents: number;
  target_date: string;
  monthly_contribution_cents: number;
  priority: GoalPriority;
  icon: string;
  color: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalContribution {
  id: string;
  user_id: string;
  goal_id: string;
  amount_cents: number;
  contributed_at: string;
  notes: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface Attachment {
  id: string;
  user_id: string;
  transaction_id: string | null;
  file_name: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  sidebar_collapsed: boolean;
  demo_data_enabled: boolean;
  theme: string;
  month_start_day: number;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type FinancialEventType =
  | "bill"
  | "debt_installment"
  | "subscription"
  | "income"
  | "card_closing"
  | "card_due"
  | "goal_contribution";

export interface FinancialEvent {
  id: string;
  type: FinancialEventType;
  title: string;
  amount_cents: number;
  date: string;
  status: TransactionStatus;
  category?: string;
  account_name?: string;
  source_id: string;
}
