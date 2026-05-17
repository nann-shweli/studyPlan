import { create } from 'zustand';
import type { StudyTask } from '../../types';
import { queryClient } from '../../app/queryClient';
import { StorageService } from '../../services/StorageService';
import { WidgetDataService } from '../../services/WidgetDataService';
import { queryKeys } from '../../services/queryKeys';
import { generateId } from '../../utils/idUtils';

interface TasksState {
  tasks: StudyTask[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTasks: () => Promise<void>;
  loadTasksForPlan: (planId: string) => Promise<void>;
  addTask: (data: Omit<StudyTask, 'id' | 'isCompleted'>) => Promise<StudyTask>;
  updateTask: (
    id: string,
    data: Partial<Omit<StudyTask, 'id'>>,
  ) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearTasks: () => void;
  clearError: () => void;
}

const LOAD_ERROR = 'Unable to load tasks.';
const SAVE_ERROR = 'Unable to save this task.';
const DELETE_ERROR = 'Unable to delete this task.';

const refreshWidgetData = (): void => {
  WidgetDataService.refreshFromStorage().catch(() => undefined);
};

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await queryClient.fetchQuery({
        queryKey: queryKeys.tasks,
        queryFn: StorageService.getTasks,
      });
      set({ tasks, error: null });
      refreshWidgetData();
    } catch {
      set({ error: LOAD_ERROR });
    } finally {
      set({ isLoading: false });
    }
  },

  loadTasksForPlan: async (_planId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await queryClient.fetchQuery({
        queryKey: queryKeys.tasks,
        queryFn: StorageService.getTasks,
      });
      set({ tasks, error: null });
      refreshWidgetData();
    } catch {
      set({ error: LOAD_ERROR });
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async data => {
    try {
      const newTask: StudyTask = {
        ...data,
        id: generateId(),
        isCompleted: false,
      };
      await StorageService.saveTask(newTask);
      queryClient.setQueryData<StudyTask[]>(queryKeys.tasks, current => [
        ...(current ?? []),
        newTask,
      ]);
      set(state => ({ tasks: [...state.tasks, newTask], error: null }));
      refreshWidgetData();
      return newTask;
    } catch {
      set({ error: SAVE_ERROR });
      throw new Error(SAVE_ERROR);
    }
  },

  updateTask: async (id, data) => {
    try {
      const tasks = get().tasks;
      const idx = tasks.findIndex(t => t.id === id);
      if (idx < 0) return;
      const updated: StudyTask = { ...tasks[idx], ...data };
      await StorageService.saveTask(updated);
      const newTasks = [...tasks];
      newTasks[idx] = updated;
      queryClient.setQueryData<StudyTask[]>(queryKeys.tasks, newTasks);
      set({ tasks: newTasks, error: null });
      refreshWidgetData();
    } catch {
      set({ error: SAVE_ERROR });
      throw new Error(SAVE_ERROR);
    }
  },

  toggleTask: async id => {
    try {
      const updated = await StorageService.toggleTask(id);
      if (!updated) return;
      queryClient.setQueryData<StudyTask[]>(queryKeys.tasks, current =>
        (current ?? []).map(t => (t.id === id ? updated : t)),
      );
      set(state => ({
        tasks: state.tasks.map(t => (t.id === id ? updated : t)),
        error: null,
      }));
      refreshWidgetData();
    } catch {
      set({ error: SAVE_ERROR });
      throw new Error(SAVE_ERROR);
    }
  },

  deleteTask: async id => {
    try {
      await StorageService.deleteTask(id);
      queryClient.setQueryData<StudyTask[]>(queryKeys.tasks, current =>
        (current ?? []).filter(task => task.id !== id),
      );
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id),
        error: null,
      }));
      refreshWidgetData();
    } catch {
      set({ error: DELETE_ERROR });
      throw new Error(DELETE_ERROR);
    }
  },

  clearTasks: () => {
    queryClient.setQueryData(queryKeys.tasks, []);
    set({ tasks: [] });
    refreshWidgetData();
  },
  clearError: () => set({ error: null }),
}));
