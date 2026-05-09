export interface StudyPlan {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  createdAt: string; // ISO string
}

export interface StudyTask {
  id: string;
  planId: string;
  title: string;
  date: string;      // ISO string — the day this task belongs to
  isCompleted: boolean;
}

export interface Progress {
  planId: string;
  totalTasks: number;
  completedTasks: number;
}
