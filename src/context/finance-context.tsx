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
export type ExpenseCategory =
  | 'comida'
  | 'transporte'
  | 'hogar'
  | 'ocio'
  | 'salud'
  | 'compras'
  | 'servicios'
  | 'educacion'
  | 'otros';

export type Expense = {
  id: string;
  amount: number;
  description: string;
  type: ExpenseType;
  category: ExpenseCategory;
  createdAt: string;
  householdId?: string | null;
};

export type Income = {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
};

type NewExpense = {
  amount: number;
  description: string;
  type: ExpenseType;
  category: ExpenseCategory;
};

type NewIncome = {
  amount: number;
  description: string;
};

type FinanceContextValue = {
  user: User | null;
  authLoading: boolean;
  expenses: Expense[];
  incomes: Income[];
  loadingExpenses: boolean;
  loadingIncomes: boolean;
  addExpense: (expense: NewExpense) => Promise<void>;
  addIncome: (income: NewIncome) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshExpenses: () => Promise<void>;
  refreshIncomes: () => Promise<void>;
  totalIncome: number;
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
    category: row.category ?? 'otros',
    createdAt: row.created_at,
    householdId: row.household_id,
  };
}

function mapIncome(row: any): Income {
  return {
    id: row.id,
    amount: Number(row.amount),
    description: row.description,
    createdAt: row.created_at,
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
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingIncomes, setLoadingIncomes] = useState(false);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  const refreshExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      return;
    }

    setLoadingExpenses(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('id, amount, description, type, category, created_at, household_id')
      .order('created_at', { ascending: false });
    setLoadingExpenses(false);

    if (error) {
      console.warn('No se pudieron cargar los gastos:', error.message);
      return;
    }

    setExpenses((data ?? []).map(mapExpense));
  }, [user]);

  const refreshIncomes = useCallback(async () => {
    if (!user) {
      setIncomes([]);
      return;
    }

    setLoadingIncomes(true);
    const { data, error } = await supabase
      .from('incomes')
      .select('id, amount, description, created_at')
      .order('created_at', { ascending: false });
    setLoadingIncomes(false);

    if (error) {
      console.warn('No se pudieron cargar los ingresos:', error.message);
      return;
    }

    setIncomes((data ?? []).map(mapIncome));
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
        setIncomes([]);
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
    refreshIncomes();

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
      .channel(`finance-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => refreshExpenses()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incomes' },
        () => refreshIncomes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshExpenses, refreshIncomes]);

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
          category: expense.category,
          my_share: myShare,
          partner_share: partnerShare,
        })
        .select('id, amount, description, type, category, created_at, household_id')
        .single();

      if (error) throw error;

      const saved = mapExpense(data);
      setExpenses((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    },
    [ensureHousehold, user]
  );

  const addIncome = useCallback(
    async (income: NewIncome) => {
      if (!user) throw new Error('Debes iniciar sesión.');

      const { data, error } = await supabase
        .from('incomes')
        .insert({
          created_by: user.id,
          description: income.description.trim(),
          amount: income.amount,
        })
        .select('id, amount, description, created_at')
        .single();

      if (error) throw error;

      const saved = mapIncome(data);
      setIncomes((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    },
    [user]
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

  const totalIncome = useMemo(
    () => incomes.reduce((total, income) => total + income.amount, 0),
    [incomes]
  );

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
        incomes,
        loadingExpenses,
        loadingIncomes,
        addExpense,
        addIncome,
        signIn,
        signUp,
        signOut,
        refreshExpenses,
        refreshIncomes,
        totalIncome,
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
