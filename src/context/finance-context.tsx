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
export type ExpenseCategory = string;

export type Category = {
  id: string;
  slug: string;
  name: string;
  icon: string;
};

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
  categories: Category[];
  loadingExpenses: boolean;
  loadingIncomes: boolean;
  loadingCategories: boolean;
  addExpense: (expense: NewExpense) => Promise<void>;
  addIncome: (income: NewIncome) => Promise<void>;
  addCategory: (name: string, icon: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshExpenses: () => Promise<void>;
  refreshIncomes: () => Promise<void>;
  refreshCategories: () => Promise<void>;
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

function mapCategory(row: any): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    icon: row.icon,
  };
}

function slugify(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || `categoria-${Date.now()}`;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingIncomes, setLoadingIncomes] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
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

  const refreshCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      return;
    }

    setLoadingCategories(true);
    const { data, error } = await supabase
      .from('expense_categories')
      .select('id, slug, name, icon')
      .order('created_at', { ascending: true });
    setLoadingCategories(false);

    if (error) {
      console.warn('No se pudieron cargar las categorías:', error.message);
      return;
    }

    setCategories((data ?? []).map(mapCategory));
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
        setCategories([]);
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
    refreshCategories();

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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expense_categories' },
        () => refreshCategories()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshExpenses, refreshIncomes, refreshCategories]);

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

  const addCategory = useCallback(
    async (name: string, icon: string) => {
      if (!user) throw new Error('Debes iniciar sesión.');

      const cleanName = name.trim();
      if (!cleanName) throw new Error('Escribe un nombre para la categoría.');

      if (categories.some((category) => category.name.toLowerCase() === cleanName.toLowerCase())) {
        throw new Error('Ya existe una categoría con ese nombre.');
      }

      const baseSlug = slugify(cleanName);
      let slug = baseSlug;
      if (categories.some((category) => category.slug === slug)) {
        slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
      }

      const { data, error } = await supabase
        .from('expense_categories')
        .insert({
          user_id: user.id,
          slug,
          name: cleanName,
          icon: icon || '📦',
        })
        .select('id, slug, name, icon')
        .single();

      if (error) throw error;

      const saved = mapCategory(data);
      setCategories((current) => [...current, saved]);
    },
    [categories, user]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Debes iniciar sesión.');
      if (categories.length <= 1) {
        throw new Error('Debes conservar al menos una categoría.');
      }

      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setCategories((current) => current.filter((category) => category.id !== id));
    },
    [categories.length, user]
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
        categories,
        loadingExpenses,
        loadingIncomes,
        loadingCategories,
        addExpense,
        addIncome,
        addCategory,
        deleteCategory,
        signIn,
        signUp,
        signOut,
        refreshExpenses,
        refreshIncomes,
        refreshCategories,
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
