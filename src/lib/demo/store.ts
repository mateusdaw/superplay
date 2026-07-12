import { nowInSaoPaulo } from "@/lib/date";
import {
  DEMO_USER_ID,
  createDemoDataset,
  type DemoDataset,
  type DemoPreferences,
  type DemoProfile,
} from "@/lib/demo/seed";
import { generateId } from "@/lib/utils";
import type {
  Account,
  Budget,
  CreditCard,
  Debt,
  Goal,
  RecurringExpense,
  Subscription,
  Transaction,
} from "@/types/database";

export const DEMO_STORAGE_KEY = "financeiro_demo_v1";

export type DemoListener = (state: DemoDataset) => void;

type MutableCollectionKey =
  | "transactions"
  | "accounts"
  | "creditCards"
  | "debts"
  | "recurringExpenses"
  | "subscriptions"
  | "budgets"
  | "goals";

interface MutableCollections {
  transactions: Transaction[];
  accounts: Account[];
  creditCards: CreditCard[];
  debts: Debt[];
  recurringExpenses: RecurringExpense[];
  subscriptions: Subscription[];
  budgets: Budget[];
  goals: Goal[];
}

type EntityFor<K extends MutableCollectionKey> = MutableCollections[K][number];

type MutableEntity = EntityFor<MutableCollectionKey>;

export type CreateDemoInput<T extends MutableEntity> = Omit<
  T,
  "id" | "user_id" | "is_demo" | "created_at" | "updated_at"
> &
  Partial<Pick<T, "id" | "user_id" | "is_demo" | "created_at" | "updated_at">>;

export type UpdateDemoInput<T extends MutableEntity> = Partial<
  Omit<T, "id" | "created_at" | "is_demo">
>;

class DemoStore {
  private state: DemoDataset;
  private listeners = new Set<DemoListener>();

  constructor() {
    this.state = this.load();
  }

  getState(): DemoDataset {
    return this.state;
  }

  subscribe(listener: DemoListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  refresh(): DemoDataset {
    this.state = this.load();
    this.notify();
    return this.state;
  }

  resetDemo(): DemoDataset {
    this.state = createDemoDataset();
    this.persist();
    this.notify();
    return this.state;
  }

  update(updater: (state: DemoDataset) => DemoDataset): DemoDataset {
    this.state = updater(this.state);
    this.persist();
    this.notify();
    return this.state;
  }

  updateProfile(updates: Partial<Omit<DemoProfile, "id" | "created_at">>): DemoProfile {
    const profile: DemoProfile = {
      ...this.state.profile,
      ...updates,
      id: this.state.profile.id,
      is_demo: true,
      updated_at: timestamp(),
    };
    this.update((state) => ({ ...state, profile }));
    return profile;
  }

  updatePreferences(
    updates: Partial<Omit<DemoPreferences, "id" | "user_id" | "created_at">>
  ): DemoPreferences {
    const preferences: DemoPreferences = {
      ...this.state.preferences,
      ...updates,
      id: this.state.preferences.id,
      user_id: this.state.preferences.user_id,
      is_demo: true,
      updated_at: timestamp(),
    };
    this.update((state) => ({ ...state, preferences }));
    return preferences;
  }

  addTransaction(input: CreateDemoInput<Transaction>): Transaction {
    return this.addEntity("transactions", input);
  }

  updateTransaction(id: string, updates: UpdateDemoInput<Transaction>): Transaction | null {
    return this.updateEntity("transactions", id, updates);
  }

  deleteTransaction(id: string): void {
    this.deleteEntity("transactions", id);
  }

  addAccount(input: CreateDemoInput<Account>): Account {
    return this.addEntity("accounts", input);
  }

  updateAccount(id: string, updates: UpdateDemoInput<Account>): Account | null {
    return this.updateEntity("accounts", id, updates);
  }

  deleteAccount(id: string): void {
    this.deleteEntity("accounts", id);
  }

  addCreditCard(input: CreateDemoInput<CreditCard>): CreditCard {
    return this.addEntity("creditCards", input);
  }

  addCard(input: CreateDemoInput<CreditCard>): CreditCard {
    return this.addCreditCard(input);
  }

  updateCreditCard(id: string, updates: UpdateDemoInput<CreditCard>): CreditCard | null {
    return this.updateEntity("creditCards", id, updates);
  }

  updateCard(id: string, updates: UpdateDemoInput<CreditCard>): CreditCard | null {
    return this.updateCreditCard(id, updates);
  }

  deleteCreditCard(id: string): void {
    this.deleteEntity("creditCards", id);
  }

  deleteCard(id: string): void {
    this.deleteCreditCard(id);
  }

  addDebt(input: CreateDemoInput<Debt>): Debt {
    return this.addEntity("debts", input);
  }

  updateDebt(id: string, updates: UpdateDemoInput<Debt>): Debt | null {
    return this.updateEntity("debts", id, updates);
  }

  deleteDebt(id: string): void {
    this.deleteEntity("debts", id);
  }

  addRecurringExpense(input: CreateDemoInput<RecurringExpense>): RecurringExpense {
    return this.addEntity("recurringExpenses", input);
  }

  addRecurring(input: CreateDemoInput<RecurringExpense>): RecurringExpense {
    return this.addRecurringExpense(input);
  }

  updateRecurringExpense(
    id: string,
    updates: UpdateDemoInput<RecurringExpense>
  ): RecurringExpense | null {
    return this.updateEntity("recurringExpenses", id, updates);
  }

  updateRecurring(id: string, updates: UpdateDemoInput<RecurringExpense>): RecurringExpense | null {
    return this.updateRecurringExpense(id, updates);
  }

  deleteRecurringExpense(id: string): void {
    this.deleteEntity("recurringExpenses", id);
  }

  deleteRecurring(id: string): void {
    this.deleteRecurringExpense(id);
  }

  addSubscription(input: CreateDemoInput<Subscription>): Subscription {
    return this.addEntity("subscriptions", input);
  }

  updateSubscription(id: string, updates: UpdateDemoInput<Subscription>): Subscription | null {
    return this.updateEntity("subscriptions", id, updates);
  }

  deleteSubscription(id: string): void {
    this.deleteEntity("subscriptions", id);
  }

  addBudget(input: CreateDemoInput<Budget>): Budget {
    return this.addEntity("budgets", input);
  }

  updateBudget(id: string, updates: UpdateDemoInput<Budget>): Budget | null {
    return this.updateEntity("budgets", id, updates);
  }

  deleteBudget(id: string): void {
    this.deleteEntity("budgets", id);
  }

  addGoal(input: CreateDemoInput<Goal>): Goal {
    return this.addEntity("goals", input);
  }

  updateGoal(id: string, updates: UpdateDemoInput<Goal>): Goal | null {
    return this.updateEntity("goals", id, updates);
  }

  deleteGoal(id: string): void {
    this.deleteEntity("goals", id);
  }

  private addEntity<K extends MutableCollectionKey>(
    collection: K,
    input: CreateDemoInput<EntityFor<K>>
  ): EntityFor<K> {
    const now = timestamp();
    const entity = {
      ...input,
      id: input.id ?? generateId(),
      user_id: input.user_id ?? DEMO_USER_ID,
      is_demo: true,
      created_at: input.created_at ?? now,
      updated_at: input.updated_at ?? now,
    } as EntityFor<K>;

    this.update((state) => ({
      ...state,
      [collection]: [...state[collection], entity],
    }));

    return entity;
  }

  private updateEntity<K extends MutableCollectionKey>(
    collection: K,
    id: string,
    updates: UpdateDemoInput<EntityFor<K>>
  ): EntityFor<K> | null {
    let updatedEntity: EntityFor<K> | null = null;

    this.update((state) => ({
      ...state,
      [collection]: state[collection].map((entity) => {
        if (entity.id !== id) return entity;
        updatedEntity = {
          ...entity,
          ...updates,
          id: entity.id,
          user_id: entity.user_id,
          is_demo: true,
          created_at: entity.created_at,
          updated_at: timestamp(),
        } as EntityFor<K>;
        return updatedEntity;
      }),
    }));

    return updatedEntity;
  }

  private deleteEntity<K extends MutableCollectionKey>(collection: K, id: string): void {
    this.update((state) => ({
      ...state,
      [collection]: state[collection].filter((entity) => entity.id !== id),
    }));
  }

  private load(): DemoDataset {
    if (!hasLocalStorage()) {
      return createDemoDataset();
    }

    try {
      const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (!raw) {
        const seeded = createDemoDataset();
        window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (isDemoDataset(parsed)) {
        return parsed;
      }
    } catch {
      // Corrupted demo data should never block the UI; reseed below.
    }

    const seeded = createDemoDataset();
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  private persist(): void {
    if (!hasLocalStorage()) return;
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(this.state));
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

function timestamp(): string {
  return nowInSaoPaulo().toISOString();
}

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isDemoDataset(value: unknown): value is DemoDataset {
  if (!value || typeof value !== "object") return false;

  const maybe = value as Partial<Record<keyof DemoDataset, unknown>>;
  return (
    Boolean(maybe.profile) &&
    Array.isArray(maybe.accounts) &&
    Array.isArray(maybe.creditCards) &&
    Array.isArray(maybe.categories) &&
    Array.isArray(maybe.transactions) &&
    Array.isArray(maybe.recurringExpenses) &&
    Array.isArray(maybe.debts) &&
    Array.isArray(maybe.debtPayments) &&
    Array.isArray(maybe.subscriptions) &&
    Array.isArray(maybe.budgets) &&
    Array.isArray(maybe.goals) &&
    Array.isArray(maybe.goalContributions) &&
    Array.isArray(maybe.attachments) &&
    Boolean(maybe.preferences)
  );
}

export const demoStore = new DemoStore();
