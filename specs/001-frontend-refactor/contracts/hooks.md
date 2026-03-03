# Hook Contracts

**Branch**: `001-frontend-refactor` | **Date**: 2026-03-03

All hooks export named functions from individual files in
`lib/hooks/`. All follow the existing hook conventions: kebab-case
files, object return types, `isHydrated` flag for storage hooks.

---

## useAsync\<T\>

```typescript
type UseAsyncOptions<T> = {
  immediate?: boolean;        // call on mount (default: false)
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
};

type UseAsyncReturn<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  clearError: () => void;
  reset: () => void;
};

function useAsync<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  options?: UseAsyncOptions<T>,
): UseAsyncReturn<T>;
```

**Behavior**:
- Wraps any async function with loading/error/data state
- Auto-clears error before each execution
- Catches errors, stores as `error: string`
- Supports `immediate` for mount-time execution
- `reset()` clears data + error + loading
- Does NOT retry automatically (caller controls retries)

**Replaces**: Manual `useState` + `useEffect` + try/catch in
LoginForm, SignupForm, DashboardClient, GoalsClient,
KeywordResearchClient, useChannelProfile (6+ instances).

---

## useSearchState\<F\>

```typescript
type UseSearchStateOptions<F> = {
  defaults: F;                // default filter values
  paramMap?: Partial<Record<keyof F, string>>;  // key → URL param name
  serialize?: (key: keyof F, value: unknown) => string;
  deserialize?: (key: keyof F, raw: string) => unknown;
};

type UseSearchStateReturn<F> = {
  filters: F;
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void;
  setFilters: (partial: Partial<F>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  searchKey: string;          // stable key for cache invalidation
};

function useSearchState<F extends Record<string, unknown>>(
  options: UseSearchStateOptions<F>,
): UseSearchStateReturn<F>;
```

**Behavior**:
- Syncs filter state bidirectionally with URL searchParams
- Shallow-merges partial updates
- `resetFilters()` restores defaults and clears URL params
- `hasActiveFilters` derived from comparison to defaults
- `searchKey` is a stable hash of current filters for use as
  fetch cache key
- Uses `useSearchParams` + `useRouter` internally

**Replaces**: Manual filter state + URL sync in CompetitorsClient,
TrendingClient, DashboardClient (3+ instances).

---

## usePolling\<T\>

```typescript
type UsePollingOptions<T> = {
  fetcher: () => Promise<T>;
  interval: number;           // ms between polls
  enabled?: boolean;          // default: true
  onData?: (data: T) => void;
  shouldStop?: (data: T) => boolean;  // stop condition
};

type UsePollingReturn<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  isPolling: boolean;
  pause: () => void;
  resume: () => void;
};

function usePolling<T>(
  options: UsePollingOptions<T>,
): UsePollingReturn<T>;
```

**Behavior**:
- Calls `fetcher` every `interval` ms
- Pauses on error (requires manual `resume()`)
- `shouldStop` callback to auto-stop when condition met
  (e.g., job complete)
- Cleans up interval on unmount
- `enabled` prop for conditional polling
- Does NOT poll when tab is hidden (uses `document.hidden`)

**Replaces**: Manual `setInterval` + visibility handling in
ThumbnailsClient (generation polling), TrendingClient (discovery
stream polling).

---

## useSessionStorage\<T\>

```typescript
type UseSessionStorageOptions<T> = {
  key: string;
  defaultValue: T;
  ttl?: number;               // ms, optional expiry
  validator?: (value: unknown) => value is T;
};

type UseSessionStorageReturn<T> = {
  value: T;
  setValue: (newValue: T | ((prev: T) => T)) => void;
  isHydrated: boolean;
  clear: () => void;
};

function useSessionStorage<T>(
  options: UseSessionStorageOptions<T>,
): UseSessionStorageReturn<T>;
```

**Behavior**:
- Mirrors `usePersistentState` API but for sessionStorage
- `isHydrated` flag prevents hydration mismatches
- Optional `ttl` for time-based expiry (stored as
  `{ value: T, timestamp: number }`)
- Optional `validator` for type-safe deserialization
- `clear()` removes key from sessionStorage

**Replaces**: Manual `sessionStorage.getItem/setItem` + TTL logic
in CompetitorsClient (30-min cache), DashboardClient (session state).
