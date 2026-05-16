import { create } from 'zustand';
import type { StudyPlan } from '../../types';
import { StorageService } from '../../services/StorageService';
import { generateId } from '../../utils/idUtils';

interface StudyPlansState {
  plans: StudyPlan[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPlans: () => Promise<void>;
  addPlan: (data: Omit<StudyPlan, 'id' | 'createdAt'>) => Promise<void>;
  updatePlan: (
    id: string,
    data: Partial<Omit<StudyPlan, 'id' | 'createdAt'>>,
  ) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  clearPlans: () => void;
  clearError: () => void;
}

const LOAD_ERROR = 'Unable to load study plans.';
const SAVE_ERROR = 'Unable to save this study plan.';
const DELETE_ERROR = 'Unable to delete this study plan.';

export const useStudyPlansStore = create<StudyPlansState>((set, get) => ({
  plans: [],
  isLoading: false,
  error: null,

  loadPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const plans = await StorageService.getPlans();
      set({ plans, error: null });
    } catch {
      set({ error: LOAD_ERROR });
    } finally {
      set({ isLoading: false });
    }
  },

  addPlan: async data => {
    try {
      const newPlan: StudyPlan = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      await StorageService.savePlan(newPlan);
      set(state => ({ plans: [newPlan, ...state.plans], error: null }));
    } catch {
      set({ error: SAVE_ERROR });
      throw new Error(SAVE_ERROR);
    }
  },

  updatePlan: async (id, data) => {
    try {
      const plans = get().plans;
      const idx = plans.findIndex(p => p.id === id);
      if (idx < 0) return;
      const updated: StudyPlan = { ...plans[idx], ...data };
      await StorageService.savePlan(updated);
      const newPlans = [...plans];
      newPlans[idx] = updated;
      set({ plans: newPlans, error: null });
    } catch {
      set({ error: SAVE_ERROR });
      throw new Error(SAVE_ERROR);
    }
  },

  deletePlan: async id => {
    try {
      await StorageService.deletePlan(id);
      set(state => ({
        plans: state.plans.filter(p => p.id !== id),
        error: null,
      }));
    } catch {
      set({ error: DELETE_ERROR });
      throw new Error(DELETE_ERROR);
    }
  },

  clearPlans: () => set({ plans: [] }),
  clearError: () => set({ error: null }),
}));
