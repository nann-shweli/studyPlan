/* eslint-env jest, node */

jest.mock('@notifee/react-native', () =>
  require('@notifee/react-native/jest-mock'),
);

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-mmkv', () => {
  class MockMMKV {
    constructor() {
      this.store = new Map();
    }

    set(key, value) {
      this.store.set(key, value);
    }

    getBoolean(key) {
      const value = this.store.get(key);
      return typeof value === 'boolean' ? value : undefined;
    }

    getString(key) {
      const value = this.store.get(key);
      return typeof value === 'string' ? value : undefined;
    }

    getNumber(key) {
      const value = this.store.get(key);
      return typeof value === 'number' ? value : undefined;
    }

    contains(key) {
      return this.store.has(key);
    }

    remove(key) {
      return this.store.delete(key);
    }

    getAllKeys() {
      return Array.from(this.store.keys());
    }

    clearAll() {
      this.store.clear();
    }

    addOnValueChangedListener() {
      return { remove: jest.fn() };
    }
  }

  return {
    createMMKV: jest.fn(() => new MockMMKV()),
  };
});

jest.mock('react-native-sqlite-storage', () => {
  const emptyResult = {
    rows: {
      length: 0,
      item: jest.fn(),
    },
    rowsAffected: 0,
  };
  const db = {
    executeSql: jest.fn(() => Promise.resolve([{}, emptyResult])),
    close: jest.fn(() => Promise.resolve()),
  };

  return {
    __esModule: true,
    default: {
      DEBUG: jest.fn(),
      enablePromise: jest.fn(),
      openDatabase: jest.fn(() => Promise.resolve(db)),
    },
  };
});

jest.mock('@react-native-vector-icons/ionicons', () => 'Ionicons');

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
