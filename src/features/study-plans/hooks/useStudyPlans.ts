import { useEffect, useCallback, useMemo } from 'react';
import { useStudyPlansStore } from '../studyPlansSlice';
import { useTasksStore } from '../../tasks/tasksSlice';
import { calcProgressPercent } from '../../../utils/dateUtils';
import type { Progress } from '../../../types';

export const useStudyPlans = () => {
  const {
    plans,
    isLoading,
    error,
    loadPlans,
    addPlan,
    updatePlan,
    deletePlan: deleteStudyPlan,
  } = useStudyPlansStore();
  const {
    tasks,
    isLoading: isTasksLoading,
    error: tasksError,
    loadTasks,
  } = useTasksStore();

  useEffect(() => {
    loadPlans();
    loadTasks();
  }, [loadPlans, loadTasks]);

  /** Derive progress for each plan from the tasks store */
  const getProgress = useCallback(
    (planId: string): Progress => {
      const planTasks = tasks.filter(t => t.planId === planId);
      const completedTasks = planTasks.filter(t => t.isCompleted).length;
      return { planId, totalTasks: planTasks.length, completedTasks };
    },
    [tasks],
  );

  const allProgress: Progress[] = useMemo(
    () => plans.map(p => getProgress(p.id)),
    [getProgress, plans],
  );

  const overallPercent = useMemo(() => {
    const total = allProgress.reduce((s, p) => s + p.totalTasks, 0);
    const done = allProgress.reduce((s, p) => s + p.completedTasks, 0);
    return calcProgressPercent(done, total);
  }, [allProgress]);

  const deletePlan = useCallback(
    async (id: string) => {
      await deleteStudyPlan(id);
      await loadTasks();
    },
    [deleteStudyPlan, loadTasks],
  );

  const refresh = useCallback(async () => {
    await Promise.all([loadPlans(), loadTasks()]);
  }, [loadPlans, loadTasks]);

  return {
    plans,
    isLoading: isLoading || isTasksLoading,
    error: error ?? tasksError,
    allProgress,
    overallPercent,
    getProgress,
    addPlan,
    updatePlan,
    deletePlan,
    refresh,
  };
};
