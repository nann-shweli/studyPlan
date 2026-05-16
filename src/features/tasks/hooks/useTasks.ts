import { useEffect, useCallback, useMemo } from 'react';
import { useTasksStore } from '../tasksSlice';
import { todayISO } from '../../../utils/dateUtils';
import type { StudyTask } from '../../../types';

export const useTasks = (planId?: string) => {
  const {
    tasks,
    isLoading,
    error,
    loadTasks,
    loadTasksForPlan,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  } = useTasksStore();

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const scopedTasks: StudyTask[] = useMemo(
    () => (planId ? tasks.filter(t => t.planId === planId) : tasks),
    [planId, tasks],
  );

  const todayTasks: StudyTask[] = scopedTasks.filter(
    t => t.date === todayISO(),
  );

  const completedCount = scopedTasks.filter(t => t.isCompleted).length;
  const remainingCount = scopedTasks.length - completedCount;

  const getTasksForDate = useCallback(
    (date: string): StudyTask[] => scopedTasks.filter(t => t.date === date),
    [scopedTasks],
  );

  return {
    tasks: scopedTasks,
    todayTasks,
    completedCount,
    remainingCount,
    isLoading,
    error,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    getTasksForDate,
    refresh: planId ? () => loadTasksForPlan(planId) : loadTasks,
  };
};
