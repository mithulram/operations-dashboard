import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';

const storage = new Map<string, string>();

function createLocalStorageMock() {
  return {
    getItem: (key: string) => (storage.has(key) ? storage.get(key)! : null),
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
    get length() {
      return storage.size;
    },
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
  };
}

beforeEach(() => {
  storage.clear();
  Object.defineProperty(window, 'localStorage', {
    value: createLocalStorageMock(),
    configurable: true,
  });
});

afterEach(() => {
  storage.clear();
});
