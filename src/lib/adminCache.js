import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const CACHE_PREFIX = "ryda.admin.cache.v1";
const memoryCache = new Map();

function getScopedCacheKey(userId, cacheKey) {
  return `${userId || "guest"}:${cacheKey}`;
}

function getStorageKey(scopedKey) {
  return `${CACHE_PREFIX}:${scopedKey}`;
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readPersistedEntry(scopedKey) {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(scopedKey));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(getStorageKey(scopedKey));
      return null;
    }

    return {
      data: parsed.data,
      updatedAt: Number(parsed.updatedAt || 0)
    };
  } catch {
    return null;
  }
}

function writePersistedEntry(scopedKey, entry, persistMaxAge) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(
      getStorageKey(scopedKey),
      JSON.stringify({
        data: entry.data,
        updatedAt: entry.updatedAt,
        expiresAt: entry.updatedAt + persistMaxAge
      })
    );
  } catch {
    // Ignore persistence failures and keep using the in-memory cache.
  }
}

function removePersistedEntry(scopedKey) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(getStorageKey(scopedKey));
  } catch {
    // Ignore storage cleanup failures.
  }
}

function getHydratedEntry(scopedKey, persist) {
  const existing = memoryCache.get(scopedKey);
  if (existing) {
    return existing;
  }

  if (!persist) {
    return null;
  }

  const persisted = readPersistedEntry(scopedKey);
  if (persisted) {
    memoryCache.set(scopedKey, persisted);
    return persisted;
  }

  return null;
}

function isStale(entry, staleTime) {
  if (!entry?.updatedAt) {
    return true;
  }
  return Date.now() - entry.updatedAt > staleTime;
}

function toErrorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function clearAdminDataCache(userId) {
  const prefix = userId ? `${userId}:` : "";

  Array.from(memoryCache.keys()).forEach((key) => {
    if (!userId || key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  });

  if (!isBrowser()) {
    return;
  }

  try {
    const keysToRemove = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const storageKey = window.localStorage.key(index);
      if (!storageKey || !storageKey.startsWith(`${CACHE_PREFIX}:`)) {
        continue;
      }

      if (!userId || storageKey.startsWith(`${CACHE_PREFIX}:${prefix}`)) {
        keysToRemove.push(storageKey);
      }
    }

    keysToRemove.forEach((storageKey) => window.localStorage.removeItem(storageKey));
  } catch {
    // Ignore cache cleanup failures.
  }
}

export function invalidateAdminDataCache(userId, cacheKey) {
  const scopedKey = getScopedCacheKey(userId, cacheKey);
  memoryCache.delete(scopedKey);
  removePersistedEntry(scopedKey);
}

export function useCachedResource({
  userId,
  cacheKey,
  fetcher,
  enabled = true,
  staleTime = 60_000,
  persist = false,
  persistMaxAge = staleTime,
  shouldPersist = () => true,
  emptyValue = null,
  errorMessage = "Unable to load data."
}) {
  const scopedKey = useMemo(() => getScopedCacheKey(userId, cacheKey), [cacheKey, userId]);
  const initialEntry = useMemo(() => getHydratedEntry(scopedKey, persist), [persist, scopedKey]);
  const emptyValueRef = useRef(emptyValue);
  const [data, setData] = useState(() => (initialEntry?.data ?? emptyValueRef.current));
  const [lastUpdated, setLastUpdated] = useState(() => initialEntry?.updatedAt || 0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() => Boolean(enabled && !initialEntry?.data));
  const [isFetching, setIsFetching] = useState(false);

  const runFetch = useCallback(
    async ({ force = false, background = false } = {}) => {
      if (!enabled) {
        return null;
      }

      const currentEntry = getHydratedEntry(scopedKey, persist);
      const hasCachedData = currentEntry?.data !== undefined && currentEntry?.data !== null;

      if (!force && currentEntry && !currentEntry.promise && !isStale(currentEntry, staleTime)) {
        setData(currentEntry.data);
        setLastUpdated(currentEntry.updatedAt || 0);
        setError("");
        setIsLoading(false);
        setIsFetching(false);
        return currentEntry.data;
      }

      const pendingPromise =
        currentEntry?.promise ||
        Promise.resolve()
          .then(fetcher)
          .then((nextData) => {
            const nextEntry = {
              data: nextData,
              updatedAt: Date.now()
            };

            memoryCache.set(scopedKey, nextEntry);

            if (persist && shouldPersist(nextData)) {
              writePersistedEntry(scopedKey, nextEntry, persistMaxAge);
            } else {
              removePersistedEntry(scopedKey);
            }

            return nextEntry;
          })
          .finally(() => {
            const cached = memoryCache.get(scopedKey);
            if (cached?.promise) {
              memoryCache.set(scopedKey, {
                data: cached.data,
                updatedAt: cached.updatedAt
              });
            }
          });

      memoryCache.set(scopedKey, {
        data: currentEntry?.data,
        updatedAt: currentEntry?.updatedAt || 0,
        promise: pendingPromise
      });

      setError("");
      setIsLoading(!background && !hasCachedData);
      setIsFetching(true);

      try {
        const nextEntry = await pendingPromise;
        setData(nextEntry.data);
        setLastUpdated(nextEntry.updatedAt || 0);
        setError("");
        setIsLoading(false);
        setIsFetching(false);
        return nextEntry.data;
      } catch (fetchError) {
        setError(toErrorMessage(fetchError, errorMessage));
        setIsLoading(false);
        setIsFetching(false);
        throw fetchError;
      }
    },
    [enabled, errorMessage, fetcher, persist, persistMaxAge, scopedKey, shouldPersist, staleTime]
  );

  useEffect(() => {
    const entry = getHydratedEntry(scopedKey, persist);

    if (entry?.data !== undefined && entry?.data !== null) {
      setData(entry.data);
      setLastUpdated(entry.updatedAt || 0);
      setIsLoading(false);
    } else {
      setData(emptyValueRef.current);
      setLastUpdated(0);
      setIsLoading(Boolean(enabled));
    }

    if (!enabled) {
      setIsFetching(false);
      return undefined;
    }

    let active = true;
    const shouldFetch = !entry || entry.promise || isStale(entry, staleTime);

    if (shouldFetch) {
      runFetch({ background: Boolean(entry?.data) }).catch(() => {
        if (!active) {
          return;
        }
      });
    } else {
      setIsFetching(false);
    }

    return () => {
      active = false;
    };
  }, [enabled, persist, runFetch, scopedKey, staleTime]);

  const refresh = useCallback(() => runFetch({ force: true, background: true }), [runFetch]);

  const mutate = useCallback(
    (updater, options = {}) => {
      const currentEntry = getHydratedEntry(scopedKey, persist);
      const currentData = currentEntry?.data ?? emptyValueRef.current;
      const nextData = typeof updater === "function" ? updater(currentData) : updater;
      const nextEntry = {
        data: nextData,
        updatedAt: Date.now()
      };

      memoryCache.set(scopedKey, nextEntry);

      const persistEntry = options.persist ?? persist;
      const persistAllowed = options.shouldPersist ? options.shouldPersist(nextData) : shouldPersist(nextData);

      if (persistEntry && persistAllowed) {
        writePersistedEntry(scopedKey, nextEntry, persistMaxAge);
      } else {
        removePersistedEntry(scopedKey);
      }

      setData(nextData);
      setLastUpdated(nextEntry.updatedAt);
      setError("");
      setIsLoading(false);
      setIsFetching(false);
      return nextData;
    },
    [persist, persistMaxAge, scopedKey, shouldPersist]
  );

  return {
    data,
    error,
    isLoading,
    isFetching,
    lastUpdated,
    refresh,
    mutate
  };
}
