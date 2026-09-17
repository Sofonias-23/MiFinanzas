import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export type ExpenseType = 'personal' | 'compartido';

export type Expense = {
  id: string;
  amount: number;
  description: string;
  type: ExpenseType;
  createdAt: string;
};

type FinanceContextValue = {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  totalMyExpenses: number;
  totalSharedExpenses: number;
};

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const addExpense: FinanceContextValue['addExpense'] = (expense) => {
    setExpenses((current) => [
      {
        ...expense,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  };

  const totalMyExpenses = useMemo(
    () =>
      expenses.reduce((total, expense) => {
        return total + (expense.type === 'compartido' ? expense.amount / 2 : expense.amount);
      }, 0),
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
      value={{ expenses, addExpense, totalMyExpenses, totalSharedExpenses }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error('useFinance debe usarse dentro de FinanceProvider');
  }

  return context;
}
