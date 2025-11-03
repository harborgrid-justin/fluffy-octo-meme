import { create } from 'zustand';
import { Budget, BudgetLineItem } from '@/types';

interface BudgetState {
  budgets: Budget[];
  selectedBudget: Budget | null;
  loading: boolean;
  error: string | null;

  // Actions
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  selectBudget: (budget: Budget | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],
  selectedBudget: null,
  loading: false,
  error: null,

  setBudgets: (budgets) => set({ budgets }),

  addBudget: (budget) =>
    set((state) => ({
      budgets: [...state.budgets, budget]
    })),

  updateBudget: (id, updates) =>
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
      selectedBudget:
        state.selectedBudget?.id === id
          ? { ...state.selectedBudget, ...updates }
          : state.selectedBudget
    })),

  deleteBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
      selectedBudget:
        state.selectedBudget?.id === id ? null : state.selectedBudget
    })),

  selectBudget: (budget) => set({ selectedBudget: budget }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error })
}));
