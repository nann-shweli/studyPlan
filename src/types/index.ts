export interface StudyPlan {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  createdAt: string; // ISO string
  status?: 'active' | 'paused' | 'completed';
  pausedAt?: string;
  examDate?: string;
}

export type StudyTaskPriority = 'low' | 'medium' | 'high';

export interface StudyTask {
  id: string;
  planId: string;
  title: string;
  subject?: string;
  scheduledDate?: string; // ISO string - future task model
  date: string; // ISO string - current UI compatibility
  durationMinutes?: number;
  priority?: StudyTaskPriority;
  isCompleted: boolean;
  reminderTime?: string;
}

export interface Progress {
  planId: string;
  totalTasks: number;
  completedTasks: number;
}

export interface StreakHistory {
  date: string;
  completedTasks: number;
  studyMinutes: number;
}

export interface CompletedTaskRecord {
  taskId: string;
  planId: string;
  completedAt: string;
  durationMinutes: number;
}
