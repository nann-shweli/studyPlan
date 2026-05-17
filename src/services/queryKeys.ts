export const queryKeys = {
  studyPlans: ['studyPlans'] as const,
  tasks: ['tasks'] as const,
  tasksByPlan: (planId: string) => ['tasks', 'plan', planId] as const,
  progress: ['progress'] as const,
};
