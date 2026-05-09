import { useMemo } from 'react';
import { useStudyPlansStore } from '../../study-plans/studyPlansSlice';
import { useTasksStore } from '../../tasks/tasksSlice';
import { calcProgressPercent } from '../../../utils/dateUtils';
import type { Progress } from '../../../types';

export const useProgress = () => {
  const { plans } = useStudyPlansStore();
  const { tasks } = useTasksStore();

  const progressList: Progress[] = useMemo(
    () =>
      plans.map(plan => {
        const planTasks = tasks.filter(t => t.planId === plan.id);
        return {
          planId: plan.id,
          totalTasks: planTasks.length,
          completedTasks: planTasks.filter(t => t.isCompleted).length,
        };
      }),
    [plans, tasks],
  );

  const overall = useMemo(() => {
    const total = progressList.reduce((s, p) => s + p.totalTasks, 0);
    const done = progressList.reduce((s, p) => s + p.completedTasks, 0);
    return {
      totalTasks: total,
      completedTasks: done,
      percent: calcProgressPercent(done, total),
    };
  }, [progressList]);

  return { progressList, overall };
};
