import { NativeModules } from 'react-native';
import { addMinutes, isValid, parseISO } from 'date-fns';
import type { StudyTask } from '../types';

interface CalendarNativeEvent {
  id?: string;
  startDate: string;
  endDate: string;
  notes?: string;
  alarms?: Array<{ date: number }>;
}

interface NativeCalendarEvents {
  authorizationStatus?: () => Promise<string>;
  authorizeEventStore?: () => Promise<string>;
  saveEvent?: (title: string, details: CalendarNativeEvent) => Promise<string>;
  removeEvent?: (eventId: string) => Promise<boolean>;
}

export interface CalendarSyncResult {
  ok: boolean;
  eventId?: string;
  reason?: string;
}

const getNativeCalendar = (): NativeCalendarEvents | null => {
  const module = NativeModules.RNCalendarEvents as
    | NativeCalendarEvents
    | undefined;
  return module?.saveEvent ? module : null;
};

const isAuthorized = (status?: string): boolean =>
  status === 'authorized' || status === 'fullAccess' || status === 'writeOnly';

const getTaskStartDate = (task: StudyTask): Date => {
  const baseDate = parseISO(task.scheduledDate ?? task.date);
  const date = isValid(baseDate) ? baseDate : new Date();
  const time = task.reminderTime ?? '09:00';
  const [hour = 9, minute = 0] = time.split(':').map(Number);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const buildCalendarEvent = (
  task: StudyTask,
  planTitle?: string,
): CalendarNativeEvent => {
  const startDate = getTaskStartDate(task);
  const endDate = addMinutes(startDate, task.durationMinutes || 30);
  const notes = [
    planTitle ? `Plan: ${planTitle}` : null,
    task.subject ? `Subject: ${task.subject}` : null,
    `Priority: ${task.priority ?? 'medium'}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    id: task.calendarEventId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    notes,
    alarms: task.reminderTime ? [{ date: -15 }] : undefined,
  };
};

const ensureAccess = async (
  calendar: NativeCalendarEvents,
): Promise<boolean> => {
  const currentStatus = await calendar.authorizationStatus?.();
  if (isAuthorized(currentStatus)) return true;

  const nextStatus = await calendar.authorizeEventStore?.();
  return isAuthorized(nextStatus);
};

export const CalendarService = {
  isAvailable(): boolean {
    return !!getNativeCalendar();
  },

  async saveTaskEvent(
    task: StudyTask,
    planTitle?: string,
  ): Promise<CalendarSyncResult> {
    const calendar = getNativeCalendar();
    if (!calendar?.saveEvent) {
      return {
        ok: false,
        reason:
          'Calendar native module is not installed. Add RNCalendarEvents to enable device calendar sync.',
      };
    }

    const hasAccess = await ensureAccess(calendar);
    if (!hasAccess) {
      return {
        ok: false,
        reason: 'Calendar permission was not granted.',
      };
    }

    const eventId = await calendar.saveEvent(
      task.title,
      buildCalendarEvent(task, planTitle),
    );
    return { ok: true, eventId };
  },

  async deleteTaskEvent(eventId?: string): Promise<CalendarSyncResult> {
    if (!eventId) return { ok: true };

    const calendar = getNativeCalendar();
    if (!calendar?.removeEvent) {
      return {
        ok: false,
        reason:
          'Calendar native module is not installed. The stored event id was kept on the task.',
      };
    }

    await calendar.removeEvent(eventId);
    return { ok: true };
  },
};
