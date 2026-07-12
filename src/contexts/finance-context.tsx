"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { monthKey, nowInSaoPaulo } from "@/lib/date";
import {
  demoStore,
  type CreateDemoInput,
  type UpdateDemoInput,
} from "@/lib/demo/store";
import type { DemoDataset, DemoPreferences, DemoProfile } from "@/lib/demo/seed";
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

const isDemoModeEnabled =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface FinanceContextValue extends DemoDataset {
  cards: CreditCard[];
  profileName: string;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  loading: boolean;
  isDemoMode: boolean;
  refresh: () => void;
  resetDemo: () => void;
  updateProfile: (updates: Partial<Omit<DemoProfile, "id" | "created_at">>) => DemoProfile;
  updatePreferences: (
    updates: Partial<Omit<DemoPreferences, "id" | "user_id" | "created_at">>
  ) => DemoPreferences;
  addTransaction: (input: CreateDemoInput<Transaction>) => Transaction;
  updateTransaction: (
    id: string,
    updates: UpdateDemoInput<Transaction>
  ) => Transaction | null;
  deleteTransaction: (id: string) => void;
  addAccount: (input: CreateDemoInput<Account>) => Account;
  updateAccount: (id: string, updates: UpdateDemoInput<Account>) => Account | null;
  deleteAccount: (id: string) => void;
  addCreditCard: (input: CreateDemoInput<CreditCard>) => CreditCard;
  addCard: (input: CreateDemoInput<CreditCard>) => CreditCard;
  updateCreditCard: (id: string, updates: UpdateDemoInput<CreditCard>) => CreditCard | null;
  updateCard: (id: string, updates: UpdateDemoInput<CreditCard>) => CreditCard | null;
  deleteCreditCard: (id: string) => void;
  deleteCard: (id: string) => void;
  addDebt: (input: CreateDemoInput<Debt>) => Debt;
  updateDebt: (id: string, updates: UpdateDemoInput<Debt>) => Debt | null;
  deleteDebt: (id: string) => void;
  addRecurringExpense: (input: CreateDemoInput<RecurringExpense>) => RecurringExpense;
  addRecurring: (input: CreateDemoInput<RecurringExpense>) => RecurringExpense;
  updateRecurringExpense: (
    id: string,
    updates: UpdateDemoInput<RecurringExpense>
  ) => RecurringExpense | null;
  updateRecurring: (
    id: string,
    updates: UpdateDemoInput<RecurringExpense>
  ) => RecurringExpense | null;
  deleteRecurringExpense: (id: string) => void;
  deleteRecurring: (id: string) => void;
  addSubscription: (input: CreateDemoInput<Subscription>) => Subscription;
  updateSubscription: (
    id: string,
    updates: UpdateDemoInput<Subscription>
  ) => Subscription | null;
  deleteSubscription: (id: string) => void;
  addBudget: (input: CreateDemoInput<Budget>) => Budget;
  updateBudget: (id: string, updates: UpdateDemoInput<Budget>) => Budget | null;
  deleteBudget: (id: string) => void;
  addGoal: (input: CreateDemoInput<Goal>) => Goal;
  updateGoal: (id: string, updates: UpdateDemoInput<Goal>) => Goal | null;
  deleteGoal: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoDataset>(() => demoStore.getState());
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(nowInSaoPaulo()));
  const loading = false;

  useEffect(() => {
    return demoStore.subscribe(setState);
  }, []);

  const refresh = useCallback(() => {
    setState(demoStore.refresh());
  }, []);

  const resetDemo = useCallback(() => {
    setState(demoStore.resetDemo());
    setSelectedMonth(monthKey(nowInSaoPaulo()));
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      ...state,
      cards: state.creditCards,
      profileName: "João",
      selectedMonth,
      setSelectedMonth,
      loading,
      isDemoMode: isDemoModeEnabled,
      refresh,
      resetDemo,
      updateProfile: (updates) => demoStore.updateProfile(updates),
      updatePreferences: (updates) => demoStore.updatePreferences(updates),
      addTransaction: (input) => demoStore.addTransaction(input),
      updateTransaction: (id, updates) => demoStore.updateTransaction(id, updates),
      deleteTransaction: (id) => demoStore.deleteTransaction(id),
      addAccount: (input) => demoStore.addAccount(input),
      updateAccount: (id, updates) => demoStore.updateAccount(id, updates),
      deleteAccount: (id) => demoStore.deleteAccount(id),
      addCreditCard: (input) => demoStore.addCreditCard(input),
      addCard: (input) => demoStore.addCard(input),
      updateCreditCard: (id, updates) => demoStore.updateCreditCard(id, updates),
      updateCard: (id, updates) => demoStore.updateCard(id, updates),
      deleteCreditCard: (id) => demoStore.deleteCreditCard(id),
      deleteCard: (id) => demoStore.deleteCard(id),
      addDebt: (input) => demoStore.addDebt(input),
      updateDebt: (id, updates) => demoStore.updateDebt(id, updates),
      deleteDebt: (id) => demoStore.deleteDebt(id),
      addRecurringExpense: (input) => demoStore.addRecurringExpense(input),
      addRecurring: (input) => demoStore.addRecurring(input),
      updateRecurringExpense: (id, updates) =>
        demoStore.updateRecurringExpense(id, updates),
      updateRecurring: (id, updates) => demoStore.updateRecurring(id, updates),
      deleteRecurringExpense: (id) => demoStore.deleteRecurringExpense(id),
      deleteRecurring: (id) => demoStore.deleteRecurring(id),
      addSubscription: (input) => demoStore.addSubscription(input),
      updateSubscription: (id, updates) => demoStore.updateSubscription(id, updates),
      deleteSubscription: (id) => demoStore.deleteSubscription(id),
      addBudget: (input) => demoStore.addBudget(input),
      updateBudget: (id, updates) => demoStore.updateBudget(id, updates),
      deleteBudget: (id) => demoStore.deleteBudget(id),
      addGoal: (input) => demoStore.addGoal(input),
      updateGoal: (id, updates) => demoStore.updateGoal(id, updates),
      deleteGoal: (id) => demoStore.deleteGoal(id),
    }),
    [loading, refresh, resetDemo, selectedMonth, state]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}
