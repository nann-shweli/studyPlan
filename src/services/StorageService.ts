import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite, {
  type ResultSet,
  type SQLiteDatabase,
} from 'react-native-sqlite-storage';
import type {
  CompletedTaskRecord,
  StreakHistory,
  StudyPlan,
  StudyTask,
  StudyTaskPriority,
} from '../types';

const DATABASE_NAME = 'studyplan.sqlite';
const PLANS_KEY = '@studyplan:plans';
const TASKS_KEY = '@studyplan:tasks';
const LEGACY_MIGRATION_KEY = 'legacy_async_storage_migrated';

SQLite.enablePromise(true);
SQLite.DEBUG(false);

type SqlValue = string | number | null;

interface StudyPlanRow {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  status: StudyPlan['status'] | null;
  paused_at: string | null;
  exam_date: string | null;
}

interface StudyTaskRow {
  id: string;
  plan_id: string;
  title: string;
  subject: string | null;
  scheduled_date: string;
  date: string;
  duration_minutes: number;
  priority: StudyTaskPriority;
  is_completed: number;
  reminder_time: string | null;
}

interface StreakHistoryRow {
  date: string;
  completed_tasks: number;
  study_minutes: number;
}

interface CompletedTaskRow {
  task_id: string;
  plan_id: string;
  completed_at: string;
  duration_minutes: number;
}

let databasePromise: Promise<SQLiteDatabase> | null = null;

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

const logStorageError = (operation: string, error: unknown): void => {
  if (isDev) {
    console.error(`[StorageService] ${operation} failed`, error);
  }
};

const isResultSet = (value: unknown): value is ResultSet =>
  typeof value === 'object' && value !== null && 'rows' in value;

const toResultSet = (response: unknown): ResultSet => {
  if (!Array.isArray(response)) {
    throw new Error('Unexpected SQLite response.');
  }

  const result = response.find(isResultSet);
  if (!result) {
    throw new Error('SQLite response did not include a result set.');
  }

  return result;
};

const isDuplicateColumnError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null || !('message' in error)) {
    return false;
  }

  const message = String((error as { message?: unknown }).message);
  return message.toLowerCase().includes('duplicate column name');
};

const rowsFromResult = <T>(result: ResultSet): T[] =>
  Array.from({ length: result.rows.length }, (_, index) =>
    result.rows.item(index),
  ) as T[];

const execute = async (
  db: SQLiteDatabase,
  sql: string,
  params: SqlValue[] = [],
): Promise<ResultSet> => {
  const response = await db.executeSql(sql, params);
  return toResultSet(response);
};

const getJSON = async <T>(key: string): Promise<T[]> => {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const setJSON = async <T>(key: string, data: T[]): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify(data));
};

const planFromRow = (row: StudyPlanRow): StudyPlan => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  startDate: row.start_date,
  endDate: row.end_date,
  createdAt: row.created_at,
  status: row.status ?? undefined,
  pausedAt: row.paused_at ?? undefined,
  examDate: row.exam_date ?? undefined,
});

const taskFromRow = (row: StudyTaskRow): StudyTask => ({
  id: row.id,
  planId: row.plan_id,
  title: row.title,
  subject: row.subject ?? undefined,
  scheduledDate: row.scheduled_date,
  date: row.date || row.scheduled_date,
  durationMinutes: row.duration_minutes,
  priority: row.priority,
  isCompleted: row.is_completed === 1,
  reminderTime: row.reminder_time ?? undefined,
});

const streakFromRow = (row: StreakHistoryRow): StreakHistory => ({
  date: row.date,
  completedTasks: row.completed_tasks,
  studyMinutes: row.study_minutes,
});

const completedTaskFromRow = (
  row: CompletedTaskRow,
): CompletedTaskRecord => ({
  taskId: row.task_id,
  planId: row.plan_id,
  completedAt: row.completed_at,
  durationMinutes: row.duration_minutes,
});

const getMetaValue = async (
  db: SQLiteDatabase,
  key: string,
): Promise<string | null> => {
  const result = await execute(db, 'SELECT value FROM app_meta WHERE key = ?', [
    key,
  ]);
  const rows = rowsFromResult<{ value?: string }>(result);
  return rows[0]?.value ?? null;
};

const setMetaValue = async (
  db: SQLiteDatabase,
  key: string,
  value: string,
): Promise<void> => {
  await execute(
    db,
    `INSERT OR REPLACE INTO app_meta (key, value)
     VALUES (?, ?)`,
    [key, value],
  );
};

const hasColumn = async (
  db: SQLiteDatabase,
  tableName: string,
  columnName: string,
): Promise<boolean> => {
  const result = await execute(db, `PRAGMA table_info(${tableName})`);
  return rowsFromResult<{ name: string }>(result).some(
    row => row.name === columnName,
  );
};

const addColumnIfMissing = async (
  db: SQLiteDatabase,
  tableName: string,
  columnName: string,
  definition: string,
): Promise<void> => {
  if (await hasColumn(db, tableName, columnName)) return;

  try {
    await execute(db, `ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      throw error;
    }
  }
};

const migrateSchema = async (db: SQLiteDatabase): Promise<void> => {
  await addColumnIfMissing(
    db,
    'study_plans',
    'status',
    "status TEXT NOT NULL DEFAULT 'active'",
  );
  await addColumnIfMissing(
    db,
    'study_plans',
    'paused_at',
    'paused_at TEXT',
  );
  await addColumnIfMissing(db, 'study_plans', 'exam_date', 'exam_date TEXT');

  await addColumnIfMissing(db, 'study_tasks', 'subject', 'subject TEXT');
  await addColumnIfMissing(
    db,
    'study_tasks',
    'scheduled_date',
    "scheduled_date TEXT NOT NULL DEFAULT ''",
  );
  await addColumnIfMissing(
    db,
    'study_tasks',
    'date',
    "date TEXT NOT NULL DEFAULT ''",
  );
  await addColumnIfMissing(
    db,
    'study_tasks',
    'duration_minutes',
    'duration_minutes INTEGER NOT NULL DEFAULT 0',
  );
  await addColumnIfMissing(
    db,
    'study_tasks',
    'priority',
    "priority TEXT NOT NULL DEFAULT 'medium'",
  );
  await addColumnIfMissing(
    db,
    'study_tasks',
    'reminder_time',
    'reminder_time TEXT',
  );

  await execute(
    db,
    `UPDATE study_tasks
     SET scheduled_date = date
     WHERE scheduled_date = '' AND date != ''`,
  );
  await execute(
    db,
    `UPDATE study_tasks
     SET date = scheduled_date
     WHERE date = '' AND scheduled_date != ''`,
  );
};

const createSchema = async (db: SQLiteDatabase): Promise<void> => {
  await execute(
    db,
    `CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    )`,
  );

  await execute(
    db,
    `CREATE TABLE IF NOT EXISTS study_plans (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      paused_at TEXT,
      exam_date TEXT
    )`,
  );

  await execute(
    db,
    `CREATE TABLE IF NOT EXISTS study_tasks (
      id TEXT PRIMARY KEY NOT NULL,
      plan_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT,
      scheduled_date TEXT NOT NULL,
      date TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'medium',
      is_completed INTEGER NOT NULL DEFAULT 0,
      reminder_time TEXT,
      FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
    )`,
  );

  await execute(
    db,
    `CREATE INDEX IF NOT EXISTS idx_study_tasks_plan_id
     ON study_tasks(plan_id)`,
  );

  await execute(
    db,
    `CREATE INDEX IF NOT EXISTS idx_study_tasks_scheduled_date
     ON study_tasks(scheduled_date)`,
  );

  await execute(
    db,
    `CREATE TABLE IF NOT EXISTS streak_history (
      date TEXT PRIMARY KEY NOT NULL,
      completed_tasks INTEGER NOT NULL DEFAULT 0,
      study_minutes INTEGER NOT NULL DEFAULT 0
    )`,
  );

  await execute(
    db,
    `CREATE TABLE IF NOT EXISTS completed_tasks (
      task_id TEXT PRIMARY KEY NOT NULL,
      plan_id TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES study_tasks(id) ON DELETE CASCADE
    )`,
  );

  await migrateSchema(db);
};

const upsertPlan = async (
  db: SQLiteDatabase,
  plan: StudyPlan,
): Promise<void> => {
  await execute(
    db,
    `INSERT OR REPLACE INTO study_plans (
      id,
      title,
      description,
      start_date,
      end_date,
      created_at,
      status,
      paused_at,
      exam_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      plan.id,
      plan.title,
      plan.description ?? null,
      plan.startDate,
      plan.endDate,
      plan.createdAt,
      plan.status ?? 'active',
      plan.pausedAt ?? null,
      plan.examDate ?? null,
    ],
  );
};

const upsertTask = async (
  db: SQLiteDatabase,
  task: StudyTask,
): Promise<void> => {
  const scheduledDate = task.scheduledDate ?? task.date;

  await execute(
    db,
    `INSERT OR REPLACE INTO study_tasks (
      id,
      plan_id,
      title,
      subject,
      scheduled_date,
      date,
      duration_minutes,
      priority,
      is_completed,
      reminder_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.planId,
      task.title,
      task.subject ?? null,
      scheduledDate,
      task.date || scheduledDate,
      task.durationMinutes ?? 0,
      task.priority ?? 'medium',
      task.isCompleted ? 1 : 0,
      task.reminderTime ?? null,
    ],
  );
};

const parseLegacyList = <T>(raw: string | null): T[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const migrateLegacyAsyncStorage = async (
  db: SQLiteDatabase,
): Promise<void> => {
  const migrated = await getMetaValue(db, LEGACY_MIGRATION_KEY);
  if (migrated === 'true') return;

  const [rawPlans, rawTasks] = await Promise.all([
    AsyncStorage.getItem(PLANS_KEY),
    AsyncStorage.getItem(TASKS_KEY),
  ]);
  const plans = parseLegacyList<StudyPlan>(rawPlans);
  const tasks = parseLegacyList<StudyTask>(rawTasks);

  for (const plan of plans) {
    await upsertPlan(db, plan);
  }

  for (const task of tasks) {
    await upsertTask(db, task);
  }

  await setMetaValue(db, LEGACY_MIGRATION_KEY, 'true');
};

const getDatabase = async (): Promise<SQLiteDatabase> => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabase({
      name: DATABASE_NAME,
      location: 'default',
    }).then(async db => {
      await createSchema(db);
      await migrateLegacyAsyncStorage(db);
      return db;
    }).catch(error => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
};

const getLegacyPlans = (): Promise<StudyPlan[]> => getJSON<StudyPlan>(PLANS_KEY);

const saveLegacyPlan = async (plan: StudyPlan): Promise<void> => {
  const plans = await getLegacyPlans();
  const index = plans.findIndex(item => item.id === plan.id);
  if (index >= 0) {
    plans[index] = plan;
  } else {
    plans.push(plan);
  }
  await setJSON(PLANS_KEY, plans);
};

const getLegacyTasks = (): Promise<StudyTask[]> => getJSON<StudyTask>(TASKS_KEY);

const saveLegacyTask = async (task: StudyTask): Promise<void> => {
  const tasks = await getLegacyTasks();
  const index = tasks.findIndex(item => item.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
  await setJSON(TASKS_KEY, tasks);
};

export const StorageService = {
  async getPlans(): Promise<StudyPlan[]> {
    try {
      const db = await getDatabase();
      const result = await execute(
        db,
        `SELECT * FROM study_plans
         ORDER BY created_at DESC`,
      );
      return rowsFromResult<StudyPlanRow>(result).map(planFromRow);
    } catch (error) {
      logStorageError('getPlans', error);
      return getLegacyPlans();
    }
  },

  async savePlan(plan: StudyPlan): Promise<void> {
    try {
      const db = await getDatabase();
      await upsertPlan(db, plan);
    } catch (error) {
      logStorageError('savePlan', error);
      await saveLegacyPlan(plan);
    }
  },

  async deletePlan(planId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await execute(db, 'DELETE FROM completed_tasks WHERE plan_id = ?', [
        planId,
      ]);
      await execute(db, 'DELETE FROM study_tasks WHERE plan_id = ?', [planId]);
      await execute(db, 'DELETE FROM study_plans WHERE id = ?', [planId]);
    } catch (error) {
      logStorageError('deletePlan', error);
      const [plans, tasks] = await Promise.all([
        getLegacyPlans(),
        getLegacyTasks(),
      ]);
      await Promise.all([
        setJSON(
          PLANS_KEY,
          plans.filter(plan => plan.id !== planId),
        ),
        setJSON(
          TASKS_KEY,
          tasks.filter(task => task.planId !== planId),
        ),
      ]);
    }
  },

  async getTasks(): Promise<StudyTask[]> {
    try {
      const db = await getDatabase();
      const result = await execute(
        db,
        `SELECT * FROM study_tasks
         ORDER BY scheduled_date ASC, id ASC`,
      );
      return rowsFromResult<StudyTaskRow>(result).map(taskFromRow);
    } catch (error) {
      logStorageError('getTasks', error);
      return getLegacyTasks();
    }
  },

  async getTasksByPlan(planId: string): Promise<StudyTask[]> {
    try {
      const db = await getDatabase();
      const result = await execute(
        db,
        `SELECT * FROM study_tasks
         WHERE plan_id = ?
         ORDER BY scheduled_date ASC, id ASC`,
        [planId],
      );
      return rowsFromResult<StudyTaskRow>(result).map(taskFromRow);
    } catch (error) {
      logStorageError('getTasksByPlan', error);
      return (await getLegacyTasks()).filter(task => task.planId === planId);
    }
  },

  async getTasksByDate(date: string): Promise<StudyTask[]> {
    try {
      const db = await getDatabase();
      const result = await execute(
        db,
        `SELECT * FROM study_tasks
         WHERE scheduled_date = ? OR date = ?
         ORDER BY id ASC`,
        [date, date],
      );
      return rowsFromResult<StudyTaskRow>(result).map(taskFromRow);
    } catch (error) {
      logStorageError('getTasksByDate', error);
      return (await getLegacyTasks()).filter(
        task => (task.scheduledDate ?? task.date) === date,
      );
    }
  },

  async saveTask(task: StudyTask): Promise<void> {
    try {
      const db = await getDatabase();
      await upsertTask(db, task);
    } catch (error) {
      logStorageError('saveTask', error);
      await saveLegacyTask(task);
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await execute(db, 'DELETE FROM completed_tasks WHERE task_id = ?', [
        taskId,
      ]);
      await execute(db, 'DELETE FROM study_tasks WHERE id = ?', [taskId]);
    } catch (error) {
      logStorageError('deleteTask', error);
      const tasks = await getLegacyTasks();
      await setJSON(
        TASKS_KEY,
        tasks.filter(task => task.id !== taskId),
      );
    }
  },

  async toggleTask(taskId: string): Promise<StudyTask | null> {
    try {
      const db = await getDatabase();
      const result = await execute(
        db,
        'SELECT * FROM study_tasks WHERE id = ?',
        [taskId],
      );
      const task = rowsFromResult<StudyTaskRow>(result)[0];
      if (!task) return null;

      const nextCompleted = task.is_completed === 0;
      const completedAt = new Date().toISOString();
      await execute(
        db,
        'UPDATE study_tasks SET is_completed = ? WHERE id = ?',
        [nextCompleted ? 1 : 0, taskId],
      );

      if (nextCompleted) {
        await execute(
          db,
          `INSERT OR REPLACE INTO completed_tasks (
            task_id,
            plan_id,
            completed_at,
            duration_minutes
          ) VALUES (?, ?, ?, ?)`,
          [task.id, task.plan_id, completedAt, task.duration_minutes],
        );
      } else {
        await execute(db, 'DELETE FROM completed_tasks WHERE task_id = ?', [
          taskId,
        ]);
      }

      return taskFromRow({
        ...task,
        is_completed: nextCompleted ? 1 : 0,
      });
    } catch (error) {
      logStorageError('toggleTask', error);
      const tasks = await getLegacyTasks();
      const task = tasks.find(item => item.id === taskId);
      if (!task) return null;

      const updated = { ...task, isCompleted: !task.isCompleted };
      await setJSON(
        TASKS_KEY,
        tasks.map(item => (item.id === taskId ? updated : item)),
      );
      return updated;
    }
  },

  async getStreakHistory(): Promise<StreakHistory[]> {
    try {
      const db = await getDatabase();
      const result = await execute(
        db,
        `SELECT * FROM streak_history
         ORDER BY date DESC`,
      );
      return rowsFromResult<StreakHistoryRow>(result).map(streakFromRow);
    } catch (error) {
      logStorageError('getStreakHistory', error);
      return [];
    }
  },

  async getCompletedTasks(): Promise<CompletedTaskRecord[]> {
    try {
      const db = await getDatabase();
      const result = await execute(
        db,
        `SELECT * FROM completed_tasks
         ORDER BY completed_at DESC`,
      );
      return rowsFromResult<CompletedTaskRow>(result).map(completedTaskFromRow);
    } catch (error) {
      logStorageError('getCompletedTasks', error);
      return [];
    }
  },

  async clearAllData(): Promise<void> {
    try {
      const db = await getDatabase();
      await execute(db, 'DELETE FROM completed_tasks');
      await execute(db, 'DELETE FROM streak_history');
      await execute(db, 'DELETE FROM study_tasks');
      await execute(db, 'DELETE FROM study_plans');
    } catch (error) {
      logStorageError('clearAllData', error);
    }

    await Promise.all([
      AsyncStorage.removeItem(PLANS_KEY),
      AsyncStorage.removeItem(TASKS_KEY),
    ]);
  },
};
