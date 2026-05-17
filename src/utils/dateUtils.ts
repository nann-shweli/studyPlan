import {
  differenceInCalendarDays,
  format,
  isFuture,
  isPast,
  isToday,
  isValid,
  parseISO,
  startOfToday,
} from 'date-fns';

export type WeekStartsOn = 0 | 1;

interface WeekSettings {
  weekStartsMonday: boolean;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getWeekStartsOn = (settings: WeekSettings): WeekStartsOn =>
  settings.weekStartsMonday ? 1 : 0;

export const getWeekDays = (settings: WeekSettings): string[] => {
  const weekStartsOn = getWeekStartsOn(settings);
  return [
    ...WEEK_DAYS.slice(weekStartsOn),
    ...WEEK_DAYS.slice(0, weekStartsOn),
  ];
};

/** Returns today's date as an ISO date string (YYYY-MM-DD) */
export const todayISO = (): string => format(new Date(), 'yyyy-MM-dd');

/** Format a date ISO string to a human-readable display string */
export const formatDate = (iso: string, pattern = 'MMM d, yyyy'): string => {
  const date = parseISO(iso);
  return isValid(date) ? format(date, pattern) : iso;
};

/** Format a date ISO string to a short display (e.g. "May 8") */
export const formatShortDate = (iso: string): string =>
  formatDate(iso, 'MMM d');

export const getDaysUntil = (iso?: string): number | null => {
  if (!iso) return null;
  const date = parseISO(iso);
  return isValid(date) ? differenceInCalendarDays(date, startOfToday()) : null;
};

export const formatCountdown = (iso?: string): string | null => {
  const days = getDaysUntil(iso);
  if (days === null) return null;
  if (days < 0) return `${Math.abs(days)}d past`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days}d left`;
};

/** Check if an ISO date string represents today */
export const isDateToday = (iso: string): boolean => {
  const date = parseISO(iso);
  return isValid(date) && isToday(date);
};

/** Check if an ISO date string is in the past */
export const isDatePast = (iso: string): boolean => {
  const date = parseISO(iso);
  return isValid(date) && isPast(date) && !isToday(date);
};

/** Check if an ISO date string is in the future */
export const isDateFuture = (iso: string): boolean => {
  const date = parseISO(iso);
  return isValid(date) && isFuture(date);
};

/** Calculate progress percentage (0–100) */
export const calcProgressPercent = (
  completed: number,
  total: number,
): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};
