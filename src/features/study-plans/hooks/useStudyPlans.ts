import { useEffect, useCallback } from 'react';
import { useStudyPlansStore } from '../studyPlansSlice';
import { useTasksStore } from '../../tasks/tasksSlice';
import { calcProgressPercent } from '../../../utils/dateUtils';
import type { Progress } from '../../../types';

export const useStudyPlans = () => {
  const { plans, isLoading, loadPlans, addPlan, updatePlan, deletePlan } =
    useStudyPlansStore();
  const { tasks, loadTasks } = useTasksStore();

  useEffect(() => {
    loadPlans();
    loadTasks();
  }, []);

  /** Derive progress for each plan from the tasks store */
  const getProgress = useCallback(
    (planId: string): Progress => {
      const planTasks = tasks.filter(t => t.planId === planId);
      const completedTasks = planTasks.filter(t => t.isCompleted).length;
      return { planId, totalTasks: planTasks.length, completedTasks };
    },
    [tasks],
  );

  const allProgress: Progress[] = plans.map(p => getProgress(p.id));

  const overallPercent = (() => {
    const total = allProgress.reduce((s, p) => s + p.totalTasks, 0);
    const done = allProgress.reduce((s, p) => s + p.completedTasks, 0);
    return calcProgressPercent(done, total);
  })();

  return {
    plans,
    isLoading,
    allProgress,
    overallPercent,
    getProgress,
    addPlan,
    updatePlan,
    deletePlan,
    refresh: loadPlans,
  };
};
