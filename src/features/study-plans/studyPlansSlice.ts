import { create } from 'zustand';
import type { StudyPlan } from '../../types';
import { StorageService } from '../../services/StorageService';
import { generateId } from '../../utils/idUtils';

interface StudyPlansState {
  plans: StudyPlan[];
  isLoading: boolean;

  // Actions
  loadPlans: () => Promise<void>;
  addPlan: (data: Omit<StudyPlan, 'id' | 'createdAt'>) => Promise<void>;
  updatePlan: (
    id: string,
    data: Partial<Omit<StudyPlan, 'id' | 'createdAt'>>,
  ) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  clearPlans: () => void;
}

export const useStudyPlansStore = create<StudyPlansState>((set, get) => ({
  plans: [],
  isLoading: false,

  loadPlans: async () => {
    set({ isLoading: true });
    const plans = await StorageService.getPlans();
    set({ plans, isLoading: false });
  },

  addPlan: async data => {
    const newPlan: StudyPlan = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await StorageService.savePlan(newPlan);
    set(state => ({ plans: [newPlan, ...state.plans] }));
  },

  updatePlan: async (id, data) => {
    const plans = get().plans;
    const idx = plans.findIndex(p => p.id === id);
    if (idx < 0) return;
    const updated: StudyPlan = { ...plans[idx], ...data };
    await StorageService.savePlan(updated);
    const newPlans = [...plans];
    newPlans[idx] = updated;
    set({ plans: newPlans });
  },

  deletePlan: async id => {
    await StorageService.deletePlan(id);
    set(state => ({ plans: state.plans.filter(p => p.id !== id) }));
  },

  clearPlans: () => set({ plans: [] }),
}));
