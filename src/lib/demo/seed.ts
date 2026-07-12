import { addMonths, monthKey, nowInSaoPaulo, subMonths, toISODate } from "@/lib/date";
import { reaisToCents } from "@/lib/money";
import { generateId } from "@/lib/utils";
import type {
  Account,
  Attachment,
  Budget,
  Category,
  CreditCard,
  Debt,
  DebtPayment,
  Goal,
  GoalContribution,
  PaymentMethod,
  Profile,
  Recurrence,
  RecurringExpense,
  Subscription,
  Transaction,
  TransactionStatus,
  TransactionType,
  UserPreferences,
} from "@/types/database";

export const DEMO_USER_ID = "demo-user";

export type DemoProfile = Profile & { is_demo: true };
export type DemoPreferences = UserPreferences & { is_demo: true };

export interface DemoDataset {
  profile: DemoProfile;
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
  transactions: Transaction[];
  recurringExpenses: RecurringExpense[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  subscriptions: Subscription[];
  budgets: Budget[];
  goals: Goal[];
  goalContributions: GoalContribution[];
  attachments: Attachment[];
  preferences: DemoPreferences;
}

type CategoryKey =
  | "salario"
  | "moradia"
  | "alimentacao"
  | "transporte"
  | "lazer"
  | "assinaturas"
  | "saude"
  | "educacao"
  | "compras"
  | "dividas"
  | "outros";

type AccountKey = "nubank" | "inter" | "carteira" | "xp";
type CardKey = "nubank" | "inter" | "c6";

interface TransactionSeed {
  description: string;
  amount: number | string;
  type: TransactionType;
  categoryKey: CategoryKey;
  date: string;
  dueDate?: string | null;
  paymentDate?: string | null;
  accountKey?: AccountKey | null;
  cardKey?: CardKey | null;
  paymentMethod?: PaymentMethod | null;
  status?: TransactionStatus;
  notes?: string | null;
  isRecurring?: boolean;
  installmentTotal?: number | null;
  installmentCurrent?: number | null;
  tags?: string[];
}

export function createDemoDataset(): DemoDataset {
  const today = nowInSaoPaulo();
  const timestamp = today.toISOString();
  const currentMonth = monthKey(today);
  const previousMonth = monthKey(subMonths(today, 1));
  const twoMonthsAgo = monthKey(subMonths(today, 2));
  const currentDay = today.getDate();
  const overdueDate =
    currentDay > 3 ? dayInMonth(currentMonth, currentDay - 3) : dayInMonth(previousMonth, 28);
  const dueToday = toISODate(today);

  const accountIds: Record<AccountKey, string> = {
    nubank: generateId(),
    inter: generateId(),
    carteira: generateId(),
    xp: generateId(),
  };
  const cardIds: Record<CardKey, string> = {
    nubank: generateId(),
    inter: generateId(),
    c6: generateId(),
  };
  const categoryIds: Record<CategoryKey, string> = {
    salario: generateId(),
    moradia: generateId(),
    alimentacao: generateId(),
    transporte: generateId(),
    lazer: generateId(),
    assinaturas: generateId(),
    saude: generateId(),
    educacao: generateId(),
    compras: generateId(),
    dividas: generateId(),
    outros: generateId(),
  };

  const profile: DemoProfile = {
    id: DEMO_USER_ID,
    full_name: "João Silva",
    email: "joao.silva@example.com",
    avatar_url: null,
    timezone: "America/Sao_Paulo",
    locale: "pt-BR",
    currency: "BRL",
    created_at: timestamp,
    updated_at: timestamp,
    is_demo: true,
  };

  const accounts: Account[] = [
    {
      id: accountIds.nubank,
      user_id: DEMO_USER_ID,
      name: "Nubank Conta",
      institution: "Nubank",
      type: "checking",
      initial_balance_cents: cents(12850.75),
      current_balance_cents: cents(18742.3),
      color: "#8A05BE",
      is_active: true,
      is_demo: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      id: accountIds.inter,
      user_id: DEMO_USER_ID,
      name: "Inter Poupança",
      institution: "Banco Inter",
      type: "savings",
      initial_balance_cents: cents(22300),
      current_balance_cents: cents(26785.42),
      color: "#FF7A00",
      is_active: true,
      is_demo: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      id: accountIds.carteira,
      user_id: DEMO_USER_ID,
      name: "Carteira",
      institution: "Dinheiro",
      type: "cash",
      initial_balance_cents: cents(450),
      current_balance_cents: cents(327.8),
      color: "#16A34A",
      is_active: true,
      is_demo: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      id: accountIds.xp,
      user_id: DEMO_USER_ID,
      name: "XP Investimentos",
      institution: "XP",
      type: "investment",
      initial_balance_cents: cents(38500),
      current_balance_cents: cents(42180.9),
      color: "#111827",
      is_active: true,
      is_demo: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
  ];

  const creditCards: CreditCard[] = [
    {
      id: cardIds.nubank,
      user_id: DEMO_USER_ID,
      name: "Nubank Roxinho",
      bank: "Nubank",
      brand: "mastercard",
      credit_limit_cents: cents(12000),
      available_limit_cents: cents(7460.2),
      closing_day: 25,
      due_day: 5,
      color: "#8A05BE",
      last_four: "4382",
      is_active: true,
      is_demo: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      id: cardIds.inter,
      user_id: DEMO_USER_ID,
      name: "Inter Black",
      bank: "Banco Inter",
      brand: "mastercard",
      credit_limit_cents: cents(18000),
      available_limit_cents: cents(12870.65),
      closing_day: 18,
      due_day: 28,
      color: "#111827",
      last_four: "9014",
      is_active: true,
      is_demo: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      id: cardIds.c6,
      user_id: DEMO_USER_ID,
      name: "C6 Carbon",
      bank: "C6 Bank",
      brand: "mastercard",
      credit_limit_cents: cents(15000),
      available_limit_cents: cents(11230.1),
      closing_day: 10,
      due_day: 20,
      color: "#334155",
      last_four: "7721",
      is_active: true,
      is_demo: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
  ];

  const categories: Category[] = [
    category("salario", "Salário", "BriefcaseBusiness", "#16A34A", "income", categoryIds, timestamp),
    category("moradia", "Moradia", "Home", "#2563EB", "expense", categoryIds, timestamp),
    category("alimentacao", "Alimentação", "Utensils", "#F97316", "expense", categoryIds, timestamp),
    category("transporte", "Transporte", "Car", "#0EA5E9", "expense", categoryIds, timestamp),
    category("lazer", "Lazer", "Gamepad2", "#A855F7", "expense", categoryIds, timestamp),
    category("assinaturas", "Assinaturas", "Repeat", "#EC4899", "expense", categoryIds, timestamp),
    category("saude", "Saúde", "HeartPulse", "#EF4444", "expense", categoryIds, timestamp),
    category("educacao", "Educação", "GraduationCap", "#6366F1", "expense", categoryIds, timestamp),
    category("compras", "Compras", "ShoppingBag", "#F59E0B", "expense", categoryIds, timestamp),
    category("dividas", "Dívidas", "ReceiptText", "#DC2626", "expense", categoryIds, timestamp),
    category("outros", "Outros", "CircleEllipsis", "#64748B", "both", categoryIds, timestamp),
  ];

  const transactions = transactionSeeds({
    currentMonth,
    previousMonth,
    twoMonthsAgo,
    overdueDate,
    dueToday,
  }).map((seed) =>
    transaction(seed, {
      accountIds,
      cardIds,
      categoryIds,
      timestamp,
    })
  );

  const recurringExpenses: RecurringExpense[] = [
    recurring("Aluguel", 2850, "moradia", 7, "monthly", accountIds.nubank, categoryIds, timestamp),
    recurring("Energia", 238.9, "moradia", 14, "monthly", accountIds.nubank, categoryIds, timestamp),
    recurring("Internet", 129.9, "moradia", 15, "monthly", accountIds.inter, categoryIds, timestamp),
    recurring("Água", 76.8, "moradia", 10, "monthly", accountIds.nubank, categoryIds, timestamp),
    recurring("Academia", 119.9, "saude", 20, "monthly", accountIds.inter, categoryIds, timestamp),
  ];

  const debts: Debt[] = [
    {
      id: generateId(),
      user_id: DEMO_USER_ID,
      name: "Financiamento carro",
      creditor: "Banco Toyota",
      original_amount_cents: cents(62000),
      current_balance_cents: cents(38450.6),
      interest_rate_annual: 16.8,
      installment_amount_cents: cents(1320),
      total_installments: 60,
      paid_installments: 24,
      due_day: 12,
      start_date: dayInMonth(monthKey(subMonths(today, 24)), 12),
      notes: "Contrato do Corolla 2021, parcela com seguro incluso.",
      status: "overdue",
      is_demo: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      id: generateId(),
      user_id: DEMO_USER_ID,
      name: "Empréstimo pessoal",
      creditor: "Banco Inter",
      original_amount_cents: cents(18000),
      current_balance_cents: cents(8950.4),
      interest_rate_annual: 24.5,
      installment_amount_cents: cents(820),
      total_installments: 24,
      paid_installments: 13,
      due_day: 22,
      start_date: dayInMonth(monthKey(subMonths(today, 13)), 22),
      notes: "Usado para reforma do apartamento.",
      status: "active",
      is_demo: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
  ];

  const debtPayments: DebtPayment[] = [
    {
      id: generateId(),
      user_id: DEMO_USER_ID,
      debt_id: debts[0].id,
      amount_cents: cents(1320),
      paid_at: dayInMonth(previousMonth, 12),
      notes: "Parcela paga no débito automático.",
      is_demo: true,
      created_at: timestamp,
    },
    {
      id: generateId(),
      user_id: DEMO_USER_ID,
      debt_id: debts[1].id,
      amount_cents: cents(820),
      paid_at: dayInMonth(previousMonth, 22),
      notes: "Parcela do empréstimo pessoal.",
      is_demo: true,
      created_at: timestamp,
    },
  ];

  const subscriptions: Subscription[] = [
    subscription(
      "Netflix",
      55.9,
      "assinaturas",
      10,
      accountIds.nubank,
      currentMonth,
      categoryIds,
      timestamp
    ),
    subscription(
      "Spotify",
      21.9,
      "assinaturas",
      10,
      accountIds.nubank,
      currentMonth,
      categoryIds,
      timestamp
    ),
    subscription(
      "iCloud",
      14.9,
      "assinaturas",
      16,
      accountIds.nubank,
      currentMonth,
      categoryIds,
      timestamp
    ),
    subscription(
      "ChatGPT",
      99.9,
      "assinaturas",
      18,
      accountIds.inter,
      currentMonth,
      categoryIds,
      timestamp
    ),
    subscription(
      "Amazon Prime",
      19.9,
      "assinaturas",
      8,
      accountIds.nubank,
      currentMonth,
      categoryIds,
      timestamp
    ),
  ];

  const budgets: Budget[] = [
    budget("moradia", 3900, currentMonth, categoryIds, timestamp),
    budget("alimentacao", 1850, currentMonth, categoryIds, timestamp),
    budget("transporte", 900, currentMonth, categoryIds, timestamp),
    budget("lazer", 650, currentMonth, categoryIds, timestamp),
    budget("assinaturas", 260, currentMonth, categoryIds, timestamp),
    budget("saude", 500, currentMonth, categoryIds, timestamp),
    budget("educacao", 550, currentMonth, categoryIds, timestamp),
    budget("compras", 900, currentMonth, categoryIds, timestamp),
    budget("dividas", 2500, currentMonth, categoryIds, timestamp),
    budget("outros", 400, currentMonth, categoryIds, timestamp),
  ];

  const goals: Goal[] = [
    goal(
      "Reserva de emergência",
      60000,
      28450,
      addMonths(today, 18),
      1800,
      "high",
      "ShieldCheck",
      "#16A34A",
      timestamp
    ),
    goal(
      "Viagem Europa",
      32000,
      8750,
      addMonths(today, 14),
      1450,
      "medium",
      "Plane",
      "#2563EB",
      timestamp
    ),
    goal(
      "Novo notebook",
      14500,
      5200,
      addMonths(today, 7),
      1200,
      "medium",
      "Laptop",
      "#9333EA",
      timestamp
    ),
  ];

  const goalContributions: GoalContribution[] = [
    contribution(goals[0].id, 1800, dayInMonth(currentMonth, 6), "Aporte mensal da reserva.", timestamp),
    contribution(goals[1].id, 900, dayInMonth(currentMonth, 9), "Câmbio separado para a viagem.", timestamp),
    contribution(goals[2].id, 1200, dayInMonth(previousMonth, 8), "Aporte do notebook.", timestamp),
  ];
  const attachments: Attachment[] = [];

  const preferences: DemoPreferences = {
    id: generateId(),
    user_id: DEMO_USER_ID,
    sidebar_collapsed: false,
    demo_data_enabled: true,
    theme: "system",
    month_start_day: 1,
    notifications_enabled: true,
    created_at: timestamp,
    updated_at: timestamp,
    is_demo: true,
  };

  return {
    profile,
    accounts,
    creditCards,
    categories,
    transactions,
    recurringExpenses,
    debts,
    debtPayments,
    subscriptions,
    budgets,
    goals,
    goalContributions,
    attachments,
    preferences,
  };
}

function cents(value: number | string): number {
  return reaisToCents(value);
}

function category(
  key: CategoryKey,
  name: string,
  icon: string,
  color: string,
  type: TransactionType | "both",
  ids: Record<CategoryKey, string>,
  timestamp: string
): Category {
  return {
    id: ids[key],
    user_id: DEMO_USER_ID,
    name,
    icon,
    color,
    type,
    parent_id: null,
    is_system: false,
    is_demo: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function transaction(
  seed: TransactionSeed,
  refs: {
    accountIds: Record<AccountKey, string>;
    cardIds: Record<CardKey, string>;
    categoryIds: Record<CategoryKey, string>;
    timestamp: string;
  }
): Transaction {
  const status = seed.status ?? "paid";
  const paymentDate =
    seed.paymentDate === undefined ? (status === "paid" ? seed.date : null) : seed.paymentDate;

  return {
    id: generateId(),
    user_id: DEMO_USER_ID,
    description: seed.description,
    amount_cents: cents(seed.amount),
    type: seed.type,
    category_id: refs.categoryIds[seed.categoryKey],
    subcategory_id: null,
    date: seed.date,
    due_date: seed.dueDate === undefined ? seed.date : seed.dueDate,
    payment_date: paymentDate,
    account_id: seed.accountKey ? refs.accountIds[seed.accountKey] : null,
    credit_card_id: seed.cardKey ? refs.cardIds[seed.cardKey] : null,
    payment_method: seed.paymentMethod ?? null,
    status,
    notes: seed.notes ?? null,
    attachment_url: null,
    is_recurring: seed.isRecurring ?? false,
    installment_total: seed.installmentTotal ?? null,
    installment_current: seed.installmentCurrent ?? null,
    parent_transaction_id: null,
    tags: seed.tags ?? [],
    is_demo: true,
    created_at: refs.timestamp,
    updated_at: refs.timestamp,
  };
}

function recurring(
  name: string,
  amount: number | string,
  categoryKey: CategoryKey,
  dueDay: number,
  recurrence: Recurrence,
  accountId: string,
  categoryIds: Record<CategoryKey, string>,
  timestamp: string
): RecurringExpense {
  return {
    id: generateId(),
    user_id: DEMO_USER_ID,
    name,
    amount_cents: cents(amount),
    category_id: categoryIds[categoryKey],
    due_day: dueDay,
    recurrence,
    start_date: dayInMonth(monthKey(subMonths(nowInSaoPaulo(), 10)), dueDay),
    end_date: null,
    auto_pay: name !== "Água",
    account_id: accountId,
    is_active: true,
    is_demo: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function subscription(
  name: string,
  amount: number | string,
  categoryKey: CategoryKey,
  billingDay: number,
  accountId: string,
  currentMonth: string,
  categoryIds: Record<CategoryKey, string>,
  timestamp: string
): Subscription {
  return {
    id: generateId(),
    user_id: DEMO_USER_ID,
    name,
    amount_cents: cents(amount),
    category_id: categoryIds[categoryKey],
    billing_day: billingDay,
    recurrence: "monthly",
    next_billing_date: dayInMonth(currentMonth, billingDay),
    account_id: accountId,
    is_active: true,
    is_demo: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function budget(
  categoryKey: CategoryKey,
  limit: number | string,
  month: string,
  categoryIds: Record<CategoryKey, string>,
  timestamp: string
): Budget {
  return {
    id: generateId(),
    user_id: DEMO_USER_ID,
    category_id: categoryIds[categoryKey],
    month,
    limit_cents: cents(limit),
    is_demo: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function goal(
  name: string,
  targetAmount: number | string,
  currentAmount: number | string,
  targetDate: Date,
  monthlyContribution: number | string,
  priority: Goal["priority"],
  icon: string,
  color: string,
  timestamp: string
): Goal {
  return {
    id: generateId(),
    user_id: DEMO_USER_ID,
    name,
    target_amount_cents: cents(targetAmount),
    current_amount_cents: cents(currentAmount),
    target_date: toISODate(targetDate),
    monthly_contribution_cents: cents(monthlyContribution),
    priority,
    icon,
    color,
    is_demo: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function contribution(
  goalId: string,
  amount: number | string,
  contributedAt: string,
  notes: string,
  timestamp: string
): GoalContribution {
  return {
    id: generateId(),
    user_id: DEMO_USER_ID,
    goal_id: goalId,
    amount_cents: cents(amount),
    contributed_at: contributedAt,
    notes,
    is_demo: true,
    created_at: timestamp,
  };
}

function dayInMonth(month: string, requestedDay: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const day = Math.min(Math.max(requestedDay, 1), lastDay);
  return toISODate(new Date(Date.UTC(year, monthNumber - 1, day, 15)));
}

function transactionSeeds(dates: {
  currentMonth: string;
  previousMonth: string;
  twoMonthsAgo: string;
  overdueDate: string;
  dueToday: string;
}): TransactionSeed[] {
  const { currentMonth, previousMonth, twoMonthsAgo, overdueDate, dueToday } = dates;

  return [
    {
      description: "Salário João",
      amount: 9500,
      type: "income",
      categoryKey: "salario",
      date: dayInMonth(currentMonth, 5),
      accountKey: "nubank",
      paymentMethod: "transfer",
      tags: ["trabalho"],
    },
    {
      description: "Consultoria freelance",
      amount: 1800,
      type: "income",
      categoryKey: "salario",
      date: dayInMonth(currentMonth, 25),
      dueDate: dayInMonth(currentMonth, 25),
      accountKey: "inter",
      paymentMethod: "pix",
      status: "pending",
      tags: ["freela"],
    },
    {
      description: "Aluguel",
      amount: 2850,
      type: "expense",
      categoryKey: "moradia",
      date: dayInMonth(currentMonth, 7),
      accountKey: "nubank",
      paymentMethod: "transfer",
      isRecurring: true,
    },
    {
      description: "Condomínio",
      amount: 590,
      type: "expense",
      categoryKey: "moradia",
      date: dayInMonth(currentMonth, 8),
      accountKey: "nubank",
      paymentMethod: "boleto",
    },
    {
      description: "Energia",
      amount: 238.9,
      type: "expense",
      categoryKey: "moradia",
      date: dayInMonth(currentMonth, 14),
      dueDate: dayInMonth(currentMonth, 14),
      accountKey: "nubank",
      paymentMethod: "boleto",
      status: "pending",
      paymentDate: null,
      isRecurring: true,
    },
    {
      description: "Internet",
      amount: 129.9,
      type: "expense",
      categoryKey: "moradia",
      date: dayInMonth(currentMonth, 15),
      dueDate: dayInMonth(currentMonth, 15),
      accountKey: "inter",
      paymentMethod: "debit",
      status: "scheduled",
      paymentDate: null,
      isRecurring: true,
    },
    {
      description: "Água",
      amount: 76.8,
      type: "expense",
      categoryKey: "moradia",
      date: overdueDate,
      dueDate: overdueDate,
      accountKey: "nubank",
      paymentMethod: "boleto",
      status: "overdue",
      paymentDate: null,
      isRecurring: true,
      notes: "Conta em aberto para demonstrar alerta de atraso.",
    },
    {
      description: "Mercado Pão de Açúcar",
      amount: 486.32,
      type: "expense",
      categoryKey: "alimentacao",
      date: dayInMonth(currentMonth, 6),
      cardKey: "nubank",
      paymentMethod: "credit",
      tags: ["supermercado"],
    },
    {
      description: "Hortifruti Vila Madalena",
      amount: 94.7,
      type: "expense",
      categoryKey: "alimentacao",
      date: dayInMonth(currentMonth, 10),
      accountKey: "carteira",
      paymentMethod: "cash",
    },
    {
      description: "iFood jantar",
      amount: 82.3,
      type: "expense",
      categoryKey: "alimentacao",
      date: dayInMonth(currentMonth, 11),
      cardKey: "c6",
      paymentMethod: "credit",
    },
    {
      description: "Uber trabalho",
      amount: 35.6,
      type: "expense",
      categoryKey: "transporte",
      date: dayInMonth(currentMonth, 3),
      cardKey: "nubank",
      paymentMethod: "credit",
    },
    {
      description: "Estacionamento Centro",
      amount: 24,
      type: "expense",
      categoryKey: "transporte",
      date: dayInMonth(currentMonth, 4),
      accountKey: "carteira",
      paymentMethod: "cash",
    },
    {
      description: "Netflix",
      amount: 55.9,
      type: "expense",
      categoryKey: "assinaturas",
      date: dayInMonth(currentMonth, 10),
      cardKey: "nubank",
      paymentMethod: "credit",
      isRecurring: true,
    },
    {
      description: "Spotify",
      amount: 21.9,
      type: "expense",
      categoryKey: "assinaturas",
      date: dayInMonth(currentMonth, 10),
      cardKey: "nubank",
      paymentMethod: "credit",
      isRecurring: true,
    },
    {
      description: "Amazon Prime",
      amount: 19.9,
      type: "expense",
      categoryKey: "assinaturas",
      date: dayInMonth(currentMonth, 8),
      cardKey: "c6",
      paymentMethod: "credit",
      isRecurring: true,
    },
    {
      description: "Academia",
      amount: 119.9,
      type: "expense",
      categoryKey: "saude",
      date: dayInMonth(currentMonth, 20),
      dueDate: dayInMonth(currentMonth, 20),
      accountKey: "inter",
      paymentMethod: "debit",
      status: "pending",
      paymentDate: null,
      isRecurring: true,
    },
    {
      description: "Farmácia Drogasil",
      amount: 64.3,
      type: "expense",
      categoryKey: "saude",
      date: dayInMonth(currentMonth, 9),
      accountKey: "nubank",
      paymentMethod: "pix",
    },
    {
      description: "Curso online de finanças",
      amount: 179.9,
      type: "expense",
      categoryKey: "educacao",
      date: dayInMonth(currentMonth, 22),
      dueDate: dayInMonth(currentMonth, 22),
      cardKey: "inter",
      paymentMethod: "credit",
      status: "scheduled",
      paymentDate: null,
    },
    {
      description: "Roupas shopping",
      amount: 349.9,
      type: "expense",
      categoryKey: "compras",
      date: dayInMonth(currentMonth, 12),
      cardKey: "inter",
      paymentMethod: "credit",
      installmentTotal: 3,
      installmentCurrent: 1,
    },
    {
      description: "Fatura Inter Black",
      amount: 2164.3,
      type: "expense",
      categoryKey: "dividas",
      date: dueToday,
      dueDate: dueToday,
      accountKey: "nubank",
      paymentMethod: "boleto",
      status: "due_today",
      paymentDate: null,
    },
    {
      description: "Parcela financiamento carro",
      amount: 1320,
      type: "expense",
      categoryKey: "dividas",
      date: overdueDate,
      dueDate: overdueDate,
      accountKey: "nubank",
      paymentMethod: "boleto",
      status: "overdue",
      paymentDate: null,
    },
    {
      description: "Salário João",
      amount: 9500,
      type: "income",
      categoryKey: "salario",
      date: dayInMonth(previousMonth, 5),
      accountKey: "nubank",
      paymentMethod: "transfer",
    },
    {
      description: "Reembolso plano de saúde",
      amount: 320,
      type: "income",
      categoryKey: "outros",
      date: dayInMonth(previousMonth, 18),
      accountKey: "nubank",
      paymentMethod: "pix",
    },
    {
      description: "Aluguel",
      amount: 2850,
      type: "expense",
      categoryKey: "moradia",
      date: dayInMonth(previousMonth, 7),
      accountKey: "nubank",
      paymentMethod: "transfer",
      isRecurring: true,
    },
    {
      description: "Energia",
      amount: 221.4,
      type: "expense",
      categoryKey: "moradia",
      date: dayInMonth(previousMonth, 14),
      accountKey: "nubank",
      paymentMethod: "boleto",
      isRecurring: true,
    },
    {
      description: "Internet",
      amount: 129.9,
      type: "expense",
      categoryKey: "moradia",
      date: dayInMonth(previousMonth, 15),
      accountKey: "inter",
      paymentMethod: "debit",
      isRecurring: true,
    },
    {
      description: "Água",
      amount: 72.35,
      type: "expense",
      categoryKey: "moradia",
      date: dayInMonth(previousMonth, 10),
      accountKey: "nubank",
      paymentMethod: "boleto",
      isRecurring: true,
    },
    {
      description: "Mercado Carrefour",
      amount: 524.8,
      type: "expense",
      categoryKey: "alimentacao",
      date: dayInMonth(previousMonth, 6),
      cardKey: "nubank",
      paymentMethod: "credit",
    },
    {
      description: "Açougue Santa Fé",
      amount: 138.5,
      type: "expense",
      categoryKey: "alimentacao",
      date: dayInMonth(previousMonth, 13),
      accountKey: "carteira",
      paymentMethod: "cash",
    },
    {
      description: "Uber aeroporto",
      amount: 96.2,
      type: "expense",
      categoryKey: "transporte",
      date: dayInMonth(previousMonth, 3),
      cardKey: "c6",
      paymentMethod: "credit",
    },
    {
      description: "Gasolina Shell",
      amount: 267.45,
      type: "expense",
      categoryKey: "transporte",
      date: dayInMonth(previousMonth, 17),
      cardKey: "inter",
      paymentMethod: "credit",
    },
    {
      description: "Netflix",
      amount: 55.9,
      type: "expense",
      categoryKey: "assinaturas",
      date: dayInMonth(previousMonth, 10),
      cardKey: "nubank",
      paymentMethod: "credit",
      isRecurring: true,
    },
    {
      description: "Spotify",
      amount: 21.9,
      type: "expense",
      categoryKey: "assinaturas",
      date: dayInMonth(previousMonth, 10),
      cardKey: "nubank",
      paymentMethod: "credit",
      isRecurring: true,
    },
    {
      description: "Cinema e pipoca",
      amount: 126,
      type: "expense",
      categoryKey: "lazer",
      date: dayInMonth(previousMonth, 21),
      cardKey: "c6",
      paymentMethod: "credit",
    },
    {
      description: "Consulta dermatologista",
      amount: 280,
      type: "expense",
      categoryKey: "saude",
      date: dayInMonth(previousMonth, 26),
      accountKey: "inter",
      paymentMethod: "pix",
    },
    {
      description: "Curso inglês",
      amount: 310,
      type: "expense",
      categoryKey: "educacao",
      date: dayInMonth(previousMonth, 12),
      cardKey: "inter",
      paymentMethod: "credit",
    },
    {
      description: "Presente aniversário",
      amount: 219.9,
      type: "expense",
      categoryKey: "compras",
      date: dayInMonth(previousMonth, 24),
      cardKey: "nubank",
      paymentMethod: "credit",
    },
    {
      description: "Parcela empréstimo pessoal",
      amount: 820,
      type: "expense",
      categoryKey: "dividas",
      date: dayInMonth(previousMonth, 22),
      accountKey: "inter",
      paymentMethod: "debit",
    },
    {
      description: "Salário João",
      amount: 9300,
      type: "income",
      categoryKey: "salario",
      date: dayInMonth(twoMonthsAgo, 5),
      accountKey: "nubank",
      paymentMethod: "transfer",
    },
    {
      description: "Venda bicicleta",
      amount: 1450,
      type: "income",
      categoryKey: "outros",
      date: dayInMonth(twoMonthsAgo, 19),
      accountKey: "inter",
      paymentMethod: "pix",
    },
    {
      description: "Aluguel",
      amount: 2850,
      type: "expense",
      categoryKey: "moradia",
      date: dayInMonth(twoMonthsAgo, 7),
      accountKey: "nubank",
      paymentMethod: "transfer",
      isRecurring: true,
    },
    {
      description: "Energia",
      amount: 246.75,
      type: "expense",
      categoryKey: "moradia",
      date: dayInMonth(twoMonthsAgo, 14),
      accountKey: "nubank",
      paymentMethod: "boleto",
      isRecurring: true,
    },
    {
      description: "Internet",
      amount: 129.9,
      type: "expense",
      categoryKey: "moradia",
      date: dayInMonth(twoMonthsAgo, 15),
      accountKey: "inter",
      paymentMethod: "debit",
      isRecurring: true,
    },
    {
      description: "Feira livre",
      amount: 112.4,
      type: "expense",
      categoryKey: "alimentacao",
      date: dayInMonth(twoMonthsAgo, 4),
      accountKey: "carteira",
      paymentMethod: "cash",
    },
    {
      description: "Mercado St. Marche",
      amount: 612.15,
      type: "expense",
      categoryKey: "alimentacao",
      date: dayInMonth(twoMonthsAgo, 11),
      cardKey: "nubank",
      paymentMethod: "credit",
    },
    {
      description: "Bilhete único",
      amount: 220,
      type: "expense",
      categoryKey: "transporte",
      date: dayInMonth(twoMonthsAgo, 2),
      accountKey: "nubank",
      paymentMethod: "pix",
    },
    {
      description: "Manutenção do carro",
      amount: 740,
      type: "expense",
      categoryKey: "transporte",
      date: dayInMonth(twoMonthsAgo, 23),
      cardKey: "inter",
      paymentMethod: "credit",
    },
    {
      description: "Jantar com amigos",
      amount: 284.6,
      type: "expense",
      categoryKey: "lazer",
      date: dayInMonth(twoMonthsAgo, 18),
      cardKey: "c6",
      paymentMethod: "credit",
    },
    {
      description: "ChatGPT",
      amount: 99.9,
      type: "expense",
      categoryKey: "assinaturas",
      date: dayInMonth(twoMonthsAgo, 18),
      cardKey: "inter",
      paymentMethod: "credit",
      isRecurring: true,
    },
    {
      description: "iCloud",
      amount: 14.9,
      type: "expense",
      categoryKey: "assinaturas",
      date: dayInMonth(twoMonthsAgo, 16),
      cardKey: "nubank",
      paymentMethod: "credit",
      isRecurring: true,
    },
    {
      description: "Dentista",
      amount: 380,
      type: "expense",
      categoryKey: "saude",
      date: dayInMonth(twoMonthsAgo, 27),
      accountKey: "inter",
      paymentMethod: "pix",
    },
    {
      description: "Livros técnicos",
      amount: 189.7,
      type: "expense",
      categoryKey: "educacao",
      date: dayInMonth(twoMonthsAgo, 9),
      cardKey: "nubank",
      paymentMethod: "credit",
    },
    {
      description: "Tênis corrida",
      amount: 429.99,
      type: "expense",
      categoryKey: "compras",
      date: dayInMonth(twoMonthsAgo, 29),
      cardKey: "inter",
      paymentMethod: "credit",
      installmentTotal: 4,
      installmentCurrent: 2,
    },
    {
      description: "Parcela financiamento carro",
      amount: 1320,
      type: "expense",
      categoryKey: "dividas",
      date: dayInMonth(twoMonthsAgo, 12),
      accountKey: "nubank",
      paymentMethod: "boleto",
    },
  ];
}
