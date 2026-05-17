import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfToday,
} from 'date-fns';
import type { CompletedTaskRecord, StudyPlan, StudyTask } from '../types';
import { formatCountdown, todayISO } from '../utils/dateUtils';
import { StorageService } from './StorageService';

export const WIDGET_PAYLOAD_KEY = '@studyplan:widget_payload';

export interface WidgetPayload {
  generatedAt: string;
  today: {
    date: string;
    totalTasks: number;
    completedTasks: number;
    nextTask?: {
      title: string;
      subject?: string;
      time?: string;
    };
  };
  streak: {
    current: number;
  };
  nextStudyTime?: string;
  examCountdown?: {
    planTitle: string;
    label: string;
    daysLeft: number;
  };
}

const toISODate = (date: Date): string => format(date, 'yyyy-MM-dd');

const getTaskDate = (task: StudyTask): string =>
  task.scheduledDate ?? task.date;

const sortIncompleteTasks = (tasks: StudyTask[]): StudyTask[] =>
  [...tasks]
    .filter(task => !task.isCompleted)
    .sort((a, b) => {
      const dateCompare = getTaskDate(a).localeCompare(getTaskDate(b));
      if (dateCompare !== 0) return dateCompare;
      return (a.reminderTime ?? '23:59').localeCompare(
        b.reminderTime ?? '23:59',
      );
    });

const getCurrentStreak = (
  tasks: StudyTask[],
  completedRecords: CompletedTaskRecord[],
): number => {
  const completedDates = new Set(
    completedRecords.length > 0
      ? completedRecords.map(record => record.completedAt.slice(0, 10))
      : tasks.filter(task => task.isCompleted).map(task => getTaskDate(task)),
  );

  let streak = 0;
  let cursor = startOfToday();

  while (completedDates.has(toISODate(cursor))) {
    streak += 1;
    cursor = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() - 1,
    );
  }

  return streak;
};

const getExamCountdown = (
  plans: StudyPlan[],
): WidgetPayload['examCountdown'] => {
  const upcomingPlans = plans
    .filter(plan => plan.examDate && plan.status !== 'completed')
    .map(plan => ({
      plan,
      daysLeft: differenceInCalendarDays(
        parseISO(plan.examDate ?? ''),
        startOfToday(),
      ),
    }))
    .filter(item => Number.isFinite(item.daysLeft) && item.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const nextExam = upcomingPlans[0];
  if (!nextExam?.plan.examDate) return undefined;

  return {
    planTitle: nextExam.plan.title,
    label:
      formatCountdown(nextExam.plan.examDate) ?? `${nextExam.daysLeft}d left`,
    daysLeft: nextExam.daysLeft,
  };
};

const buildPayload = (
  plans: StudyPlan[],
  tasks: StudyTask[],
  completedRecords: CompletedTaskRecord[],
): WidgetPayload => {
  const today = todayISO();
  const todayTasks = tasks.filter(task => getTaskDate(task) === today);
  const nextTask = sortIncompleteTasks(tasks)[0];

  return {
    generatedAt: new Date().toISOString(),
    today: {
      date: today,
      totalTasks: todayTasks.length,
      completedTasks: todayTasks.filter(task => task.isCompleted).length,
      nextTask: nextTask
        ? {
            title: nextTask.title,
            subject: nextTask.subject,
            time: nextTask.reminderTime,
          }
        : undefined,
    },
    streak: {
      current: getCurrentStreak(tasks, completedRecords),
    },
    nextStudyTime: nextTask?.reminderTime,
    examCountdown: getExamCountdown(plans),
  };
};

export const WidgetDataService = {
  async refresh(
    plans: StudyPlan[],
    tasks: StudyTask[],
    completedRecords: CompletedTaskRecord[] = [],
  ): Promise<WidgetPayload> {
    const payload = buildPayload(plans, tasks, completedRecords);
    await AsyncStorage.setItem(WIDGET_PAYLOAD_KEY, JSON.stringify(payload));
    return payload;
  },

  async refreshFromStorage(): Promise<WidgetPayload> {
    const [plans, tasks, completedRecords] = await Promise.all([
      StorageService.getPlans(),
      StorageService.getTasks(),
      StorageService.getCompletedTasks(),
    ]);
    return this.refresh(plans, tasks, completedRecords);
  },

  async getPayload(): Promise<WidgetPayload | null> {
    const raw = await AsyncStorage.getItem(WIDGET_PAYLOAD_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as WidgetPayload;
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(WIDGET_PAYLOAD_KEY);
  },
};
