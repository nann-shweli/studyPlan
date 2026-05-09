import { create } from 'zustand';
import type { StudyTask } from '../../types';
import { StorageService } from '../../services/StorageService';
import { generateId } from '../../utils/idUtils';

interface TasksState {
  tasks: StudyTask[];
  isLoading: boolean;

  // Actions
  loadTasks: () => Promise<void>;
  loadTasksForPlan: (planId: string) => Promise<void>;
  addTask: (data: Omit<StudyTask, 'id' | 'isCompleted'>) => Promise<void>;
  updateTask: (id: string, data: Partial<Omit<StudyTask, 'id'>>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,

  loadTasks: async () => {
    set({ isLoading: true });
    const tasks = await StorageService.getTasks();
    set({ tasks, isLoading: false });
  },

  loadTasksForPlan: async (planId: string) => {
    set({ isLoading: true });
    const tasks = await StorageService.getTasksByPlan(planId);
    set({ tasks, isLoading: false });
  },

  addTask: async data => {
    const newTask: StudyTask = {
      ...data,
      id: generateId(),
      isCompleted: false,
    };
    await StorageService.saveTask(newTask);
    set(state => ({ tasks: [...state.tasks, newTask] }));
  },

  updateTask: async (id, data) => {
    const tasks = get().tasks;
    const idx = tasks.findIndex(t => t.id === id);
    if (idx < 0) return;
    const updated: StudyTask = { ...tasks[idx], ...data };
    await StorageService.saveTask(updated);
    const newTasks = [...tasks];
    newTasks[idx] = updated;
    set({ tasks: newTasks });
  },

  toggleTask: async id => {
    const updated = await StorageService.toggleTask(id);
    if (!updated) return;
    set(state => ({
      tasks: state.tasks.map(t => (t.id === id ? updated : t)),
    }));
  },

  deleteTask: async id => {
    await StorageService.deleteTask(id);
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },
}));
