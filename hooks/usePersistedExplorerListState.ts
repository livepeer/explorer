import Router from "next/router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { SortingRule } from "react-table";

import {
  defaultExplorerListState,
  ExplorerListState,
  useExplorerStore,
} from "./useExplorerStore";

type PersistedListState = {
  pageIndex: number;
  scrollY: number;
  sortBy: SortingRule<object>[];
};

type PersistedTableState<T extends object> = {
  pageIndex: number;
  sortBy: SortingRule<T>[];
};

type UsePersistedExplorerListStateOptions = {
  listKey: string;
  routePath: string;
  persistedState?: PersistedListState;
  setPersistedState?: (value: Partial<PersistedListState>) => void;
};

/** Builds the sessionStorage key used as a same-tab scroll backup for a list. */
const getScrollStorageKey = (listKey: string) =>
  `livepeer:explorer-list:${listKey}:scrollY`;

/** Reads the last saved scroll offset for a list, returning null when unavailable. */
const readStoredScrollY = (listKey: string) => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.sessionStorage.getItem(getScrollStorageKey(listKey));
    const scrollY = value ? Number(value) : NaN;

    return Number.isFinite(scrollY) ? scrollY : null;
  } catch {
    return null;
  }
};

/** Writes a non-negative rounded scroll offset for a list into sessionStorage. */
const writeStoredScrollY = (listKey: string, scrollY: number) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      getScrollStorageKey(listKey),
      `${Math.max(0, Math.round(scrollY))}`
    );
  } catch {}
};

/**
 * Persists table page/sort state and restores window scroll for a browsable list.
 *
 * `listKey` scopes stored state per list instance, while `routePath` identifies
 * the route that should trigger restoration after Back navigation. Callers can
 * provide `persistedState` and `setPersistedState` to reuse an existing store
 * slice; otherwise the hook uses the generic explorer list store.
 *
 * Returns `handleTableStateChange` for the shared Table callback,
 * `persistedState` for Table initial state, and `saveCurrentScroll` for click
 * capture before navigating from a list item.
 */
export const usePersistedExplorerListState = <T extends object = object>({
  listKey,
  routePath,
  persistedState: externalPersistedState,
  setPersistedState: externalSetPersistedState,
}: UsePersistedExplorerListStateOptions) => {
  const storedPersistedState =
    useExplorerStore((state) => state.explorerLists[listKey]) ??
    defaultExplorerListState;
  const setExplorerListState = useExplorerStore(
    (state) => state.setExplorerListState
  );
  const persistedState = externalPersistedState ?? storedPersistedState;
  const setPersistedState = useMemo(
    () =>
      externalSetPersistedState ??
      ((value: Partial<ExplorerListState>) =>
        setExplorerListState(listKey, value)),
    [externalSetPersistedState, listKey, setExplorerListState]
  );
  const activeRestoreCleanup = useRef<(() => void) | undefined>(undefined);

  const saveCurrentScroll = useCallback(() => {
    writeStoredScrollY(listKey, window.scrollY);
    setPersistedState({ scrollY: window.scrollY });
  }, [listKey, setPersistedState]);

  const restoreSavedScroll = useCallback(() => {
    const scrollY = readStoredScrollY(listKey) ?? persistedState.scrollY;

    if (scrollY <= 0) {
      return;
    }

    const getMaxScrollY = () =>
      Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      ) - window.innerHeight;

    const isAtSavedScroll = () => Math.abs(window.scrollY - scrollY) <= 2;
    const isTallEnough = () => getMaxScrollY() >= scrollY;

    if (isTallEnough() && isAtSavedScroll()) {
      return;
    }

    const startedAt = Date.now();
    const maxRestoreMs = 2000;
    let frameId: number | undefined;
    let cancelled = false;

    const restoreScroll = () => {
      if (cancelled) {
        return;
      }

      if (isTallEnough()) {
        window.scrollTo(0, scrollY);
      }

      if (
        (!isTallEnough() || !isAtSavedScroll()) &&
        Date.now() - startedAt < maxRestoreMs
      ) {
        frameId = requestAnimationFrame(restoreScroll);
      }
    };

    frameId = requestAnimationFrame(restoreScroll);

    return () => {
      cancelled = true;
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [listKey, persistedState.scrollY]);

  const startScrollRestore = useCallback(() => {
    activeRestoreCleanup.current?.();
    activeRestoreCleanup.current = restoreSavedScroll();
  }, [restoreSavedScroll]);

  useEffect(() => {
    startScrollRestore();

    return () => {
      activeRestoreCleanup.current?.();
      activeRestoreCleanup.current = undefined;
    };
  }, [startScrollRestore]);

  useEffect(() => {
    let frameId: number | null = null;
    const saveScrollToStorage = () => {
      if (frameId !== null) {
        return;
      }

      frameId = requestAnimationFrame(() => {
        frameId = null;
        writeStoredScrollY(listKey, window.scrollY);
      });
    };

    window.addEventListener("scroll", saveScrollToStorage, { passive: true });
    const restoreAfterRouteChange = (url: string) => {
      const path = url.split("?")[0].split("#")[0];

      if (path === routePath) {
        startScrollRestore();
      }
    };

    Router.events.on("routeChangeStart", saveCurrentScroll);
    Router.events.on("routeChangeComplete", restoreAfterRouteChange);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", saveScrollToStorage);
      Router.events.off("routeChangeStart", saveCurrentScroll);
      Router.events.off("routeChangeComplete", restoreAfterRouteChange);
    };
  }, [listKey, routePath, saveCurrentScroll, startScrollRestore]);

  const handleTableStateChange = useCallback(
    ({ pageIndex, sortBy }: PersistedTableState<T>) => {
      setPersistedState({
        pageIndex,
        sortBy: sortBy as SortingRule<object>[],
      });
    },
    [setPersistedState]
  );

  return {
    handleTableStateChange,
    persistedState,
    saveCurrentScroll,
  };
};
