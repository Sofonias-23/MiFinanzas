import type { User } from '@supabase/supabase-js';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase } from '@/lib/supabase';

export type ExpenseType = 'personal' | 'compartido';

export type Expense = {
  id: string;
  amount: number;
  description: string;
  type: ExpenseType;
  createdAt: string;
  householdId?: string | null;
};

type NewExpense = {
  amount: number;
  description: string;
  type: ExpenseType;
};

type FinanceContextValue = {
  user: User | null;
  authLoading: boolean;
  expenses: Expense[];
  loadingExpenses: boolean;
  addExpense: (expense: NewExpense) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshExpenses: () => Promise<void>;
  totalMyExpenses: number;
  totalSharedExpenses: number;
};

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

function mapExpense(row: any): Expense {
  return {
    id: row.id,
    amount: Number(row.amount),
    description: row.description,
    type: row.type,
    createdAt: row.created_at,
    householdId: row.household_id,
  };
}

function createUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  const refreshExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      return;
    }

    setLoadingExpenses(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('id, amount, description, type, created_at, household_id')
      .order('created_at', { ascending: false });

    setLoadingExpenses(false);

    if (error) {
      console.warn('No se pudieron cargar los gastos:', error.message);
      return;
    }

    setExpenses((data ?? []).map(mapExpense));
  }, [user]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (!session) {
        setExpenses([]);
        setHouseholdId(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    refreshExpenses();

    supabase
      .from('households')
      .select('id')
      .eq('created_by', user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) setHouseholdId(data.id);
      });

    const channel = supabase
      .channel(`expenses-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => refreshExpenses()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshExpenses]);

  const ensureHousehold = useCallback(async () => {
    if (!user) throw new Error('Debes iniciar sesión.');
    if (householdId) return householdId;

    const id = createUuid();
    const { error: householdError } = await supabase.from('households').insert({
      id,
      name: 'Nosotros',
      created_by: user.id,
    });

    if (householdError) throw householdError;

    const { error: memberError } = await supabase.from('household_members').insert({
      household_id: id,
      user_id: user.id,
      role: 'owner',
    });

    if (memberError) throw memberError;

    setHouseholdId(id);
    return id;
  }, [householdId, user]);

  const addExpense = useCallback(
    async (expense: NewExpense) => {
      if (!user) throw new Error('Debes iniciar sesión.');

      const shared = expense.type === 'compartido';
      const groupId = shared ? await ensureHousehold() : null;
      const myShare = shared ? expense.amount / 2 : expense.amount;
      const partnerShare = shared ? expense.amount / 2 : 0;

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          created_by: user.id,
          payer_id: user.id,
          household_id: groupId,
          description: expense.description.trim(),
          amount: expense.amount,
          type: expense.type,
          my_share: myShare,
          partner_share: partnerShare,
        })
        .select('id, amount, description, type, created_at, household_id')
        .single();

      if (error) throw error;

      const saved = mapExpense(data);
      setExpenses((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    },
    [ensureHousehold, user]
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName?.trim() || email.split('@')[0] },
        },
      });
      if (error) throw error;
      return Boolean(data.session);
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const totalMyExpenses = useMemo(
    () =>
      expenses.reduce(
        (total, expense) =>
          total + (expense.type === 'compartido' ? expense.amount / 2 : expense.amount),
        0
      ),
    [expenses]
  );

  const totalSharedExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.type === 'compartido')
        .reduce((total, expense) => total + expense.amount, 0),
    [expenses]
  );

  return (
    <FinanceContext.Provider
      value={{
        user,
        authLoading,
        expenses,
        loadingExpenses,
        addExpense,
        signIn,
        signUp,
        signOut,
        refreshExpenses,
        totalMyExpenses,
        totalSharedExpenses,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance debe usarse dentro de FinanceProvider');
  return context;
}
