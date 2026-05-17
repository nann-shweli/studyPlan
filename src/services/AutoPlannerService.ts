import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfToday,
} from 'date-fns';
import type { StudyPlan, StudyTaskPriority } from '../types';
import { todayISO } from '../utils/dateUtils';

export type PlannerDifficulty = 'easy' | 'medium' | 'hard';

export interface AutoPlannerInput {
  subject: string;
  examDate: string;
  topics: string;
  difficulty: PlannerDifficulty;
  availableMinutesPerDay: number;
  preferredStudyDays: number[];
  reminderTime?: string;
}

export interface GeneratedStudyTask {
  title: string;
  subject: string;
  scheduledDate: string;
  date: string;
  durationMinutes: number;
  priority: StudyTaskPriority;
  reminderTime?: string;
}

export interface GeneratedStudyPlan {
  plan: Omit<StudyPlan, 'id' | 'createdAt'>;
  tasks: GeneratedStudyTask[];
  summary: {
    totalDays: number;
    studyDays: number;
    topics: number;
    totalMinutes: number;
  };
}

const MAX_GENERATED_TASKS = 120;

const splitTopics = (topics: string): string[] =>
  topics
    .split(/[\n,]/)
    .map(topic => topic.trim())
    .filter(Boolean);

const getStudyDates = (examDate: string, preferredDays: number[]): string[] => {
  const startDate = startOfToday();
  const endDate = parseISO(examDate);

  if (!isValid(endDate)) return [];

  const daysUntilExam = Math.max(
    0,
    differenceInCalendarDays(endDate, startDate),
  );
  const preferred = new Set(preferredDays);
  const dates: string[] = [];

  for (let index = 0; index <= daysUntilExam; index += 1) {
    const date = addDays(startDate, index);
    if (preferred.has(date.getDay())) {
      dates.push(format(date, 'yyyy-MM-dd'));
    }

    if (dates.length >= MAX_GENERATED_TASKS) break;
  }

  return dates.length > 0 ? dates : [format(endDate, 'yyyy-MM-dd')];
};

const getPriority = (
  difficulty: PlannerDifficulty,
  index: number,
): StudyTaskPriority => {
  if (difficulty === 'hard') return index % 3 === 0 ? 'high' : 'medium';
  if (difficulty === 'medium') return index % 4 === 0 ? 'high' : 'medium';
  return index % 5 === 0 ? 'medium' : 'low';
};

const getTaskTitle = (
  topic: string,
  difficulty: PlannerDifficulty,
  index: number,
): string => {
  const actions =
    difficulty === 'hard'
      ? ['Deep review', 'Practice questions', 'Timed recall', 'Weak point fix']
      : difficulty === 'medium'
      ? ['Review', 'Practice', 'Summarize', 'Quiz']
      : ['Read', 'Review notes', 'Light practice', 'Recap'];

  return `${actions[index % actions.length]}: ${topic}`;
};

export const AutoPlannerService = {
  parseTopics: splitTopics,

  generatePlan(input: AutoPlannerInput): GeneratedStudyPlan {
    const topics = splitTopics(input.topics);
    const studyDates = getStudyDates(input.examDate, input.preferredStudyDays);
    const duration = Math.max(15, input.availableMinutesPerDay);

    const tasks = studyDates.map((date, index) => {
      const topic = topics[index % topics.length] ?? input.subject;
      return {
        title: getTaskTitle(topic, input.difficulty, index),
        subject: input.subject.trim(),
        scheduledDate: date,
        date,
        durationMinutes: duration,
        priority: getPriority(input.difficulty, index),
        reminderTime: input.reminderTime?.trim() || undefined,
      };
    });

    return {
      plan: {
        title: `${input.subject.trim()} Exam Plan`,
        description: `Generated ${input.difficulty} study plan for ${topics.length} topics.`,
        startDate: todayISO(),
        endDate: input.examDate,
        examDate: input.examDate,
        status: 'active',
      },
      tasks,
      summary: {
        totalDays: Math.max(
          0,
          differenceInCalendarDays(parseISO(input.examDate), startOfToday()),
        ),
        studyDays: tasks.length,
        topics: topics.length,
        totalMinutes: tasks.reduce(
          (sum, task) => sum + task.durationMinutes,
          0,
        ),
      },
    };
  },
};
