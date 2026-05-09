import { useEffect, useCallback } from 'react';
import { useTasksStore } from '../tasksSlice';
import { todayISO } from '../../../utils/dateUtils';
import type { StudyTask } from '../../../types';

export const useTasks = (planId?: string) => {
  const {
    tasks,
    isLoading,
    loadTasks,
    loadTasksForPlan,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  } = useTasksStore();

  useEffect(() => {
    if (planId) {
      loadTasksForPlan(planId);
    } else {
      loadTasks();
    }
  }, [planId]);

  const todayTasks: StudyTask[] = tasks.filter(t => t.date === todayISO());

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const remainingCount = tasks.length - completedCount;

  const getTasksForDate = useCallback(
    (date: string): StudyTask[] => tasks.filter(t => t.date === date),
    [tasks],
  );

  return {
    tasks,
    todayTasks,
    completedCount,
    remainingCount,
    isLoading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    getTasksForDate,
    refresh: planId ? () => loadTasksForPlan(planId) : loadTasks,
  };
};
