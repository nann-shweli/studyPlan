declare module 'react-native-sqlite-storage' {
  export interface ResultSetRowList {
    length: number;
    item: (index: number) => Record<string, unknown>;
  }

  export interface ResultSet {
    rows: ResultSetRowList;
    rowsAffected: number;
    insertId?: number;
  }

  export interface SQLiteDatabase {
    executeSql: (
      sql: string,
      params?: unknown[],
    ) => Promise<[ResultSet] | [unknown, ResultSet]>;
    close: () => Promise<void>;
  }

  interface SQLiteFactory {
    DEBUG: (enabled: boolean) => void;
    enablePromise: (enabled: boolean) => void;
    openDatabase: (options: {
      name: string;
      location?: string;
    }) => Promise<SQLiteDatabase>;
  }

  const SQLite: SQLiteFactory;
  export default SQLite;
}
