import AsyncStorage from '@react-native-async-storage/async-storage';

const PLANS_KEY = '@studyplan:plans';
const TASKS_KEY = '@studyplan:tasks';

// ─── Generic helpers ──────────────────────────────────────────────
async function getJSON<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

async function setJSON<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// ─── Study Plans ─────────────────────────────────────────────────
import type { StudyPlan, StudyTask } from '../types';

export const StorageService = {
  // Plans
  async getPlans(): Promise<StudyPlan[]> {
    return getJSON<StudyPlan>(PLANS_KEY);
  },

  async savePlan(plan: StudyPlan): Promise<void> {
    const plans = await this.getPlans();
    const idx = plans.findIndex(p => p.id === plan.id);
    if (idx >= 0) {
      plans[idx] = plan;
    } else {
      plans.push(plan);
    }
    await setJSON(PLANS_KEY, plans);
  },

  async deletePlan(planId: string): Promise<void> {
    const plans = await this.getPlans();
    await setJSON(
      PLANS_KEY,
      plans.filter(p => p.id !== planId),
    );
    // Also remove all tasks for this plan
    const tasks = await this.getTasks();
    await setJSON(
      TASKS_KEY,
      tasks.filter(t => t.planId !== planId),
    );
  },

  // Tasks
  async getTasks(): Promise<StudyTask[]> {
    return getJSON<StudyTask>(TASKS_KEY);
  },

  async getTasksByPlan(planId: string): Promise<StudyTask[]> {
    const tasks = await this.getTasks();
    return tasks.filter(t => t.planId === planId);
  },

  async getTasksByDate(date: string): Promise<StudyTask[]> {
    const tasks = await this.getTasks();
    return tasks.filter(t => t.date === date);
  },

  async saveTask(task: StudyTask): Promise<void> {
    const tasks = await this.getTasks();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.push(task);
    }
    await setJSON(TASKS_KEY, tasks);
  },

  async deleteTask(taskId: string): Promise<void> {
    const tasks = await this.getTasks();
    await setJSON(
      TASKS_KEY,
      tasks.filter(t => t.id !== taskId),
    );
  },

  async toggleTask(taskId: string): Promise<StudyTask | null> {
    const tasks = await this.getTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx < 0) return null;
    tasks[idx] = { ...tasks[idx], isCompleted: !tasks[idx].isCompleted };
    await setJSON(TASKS_KEY, tasks);
    return tasks[idx];
  },

  async clearAllData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(PLANS_KEY),
      AsyncStorage.removeItem(TASKS_KEY),
    ]);
  },
};
