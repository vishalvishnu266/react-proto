import { useSyncExternalStore } from 'react';

/**
 * A tiny, dependency-free global store.
 *
 * - Works inside React components (via `useAppStore` selector hook — only
 *   re-renders when the selected slice changes).
 * - Works outside React (via `appStore.get()` / `appStore.set()` — e.g. in
 *   utility functions, event handlers, tests, etc.).
 * - Persists selected fields to localStorage automatically.
 *
 * Add new global fields by:
 *   1. Extending `AppState`.
 *   2. Adding a default in `initialState`.
 *   3. (Optional) Adding the key to `PERSISTED_KEYS` if it should survive reloads.
 */

// ---------- Shape ----------
export interface AppState {
  /** Toggle used to gate developer-only UI, logging, etc. */
  devMode: boolean;
  // Add more global fields here...
  // e.g. userId: string | null;
}

const initialState: AppState = {
  devMode: false,
};

const PERSISTED_KEYS: Array<keyof AppState> = ['devMode'];
const STORAGE_KEY = 'app-store';

// ---------- Persistence helpers ----------
function loadPersisted(): Partial<AppState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<AppState>) : {};
  } catch {
    return {};
  }
}

function savePersisted(state: AppState) {
  if (typeof window === 'undefined') return;
  const toPersist: Partial<AppState> = {};
  for (const key of PERSISTED_KEYS) {
    (toPersist as any)[key] = state[key];
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

// ---------- Store core ----------
function createStore(initial: AppState) {
  let state: AppState = { ...initial, ...loadPersisted() };
  const listeners = new Set<() => void>();

  return {
    get: () => state,
    set: (patch: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => {
      const next = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...next };
      savePersisted(state);
      listeners.forEach((l) => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const appStore = createStore(initialState);

// ---------- React binding ----------
/**
 * Subscribe to a slice of the store. Component re-renders only when the
 * selected value changes (referential equality).
 *
 * @example
 *   const devMode = useAppStore((s) => s.devMode);
 *   const setDev  = (v: boolean) => appStore.set({ devMode: v });
 */
export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(
    appStore.subscribe,
    () => selector(appStore.get()),
    () => selector(initialState),
  );
}
