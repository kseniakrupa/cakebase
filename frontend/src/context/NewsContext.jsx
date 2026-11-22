import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FALLBACK_SOURCES, fetchNews } from '../services/newsApi';
import { buildNewsDocs } from '../services/search';

const NewsContext = createContext(null);

export function NewsProvider({ children }) {
  const [state, setState] = useState({
    status: 'loading',
    items: [],
    meta: null,
    error: null,
    refreshing: false,
  });
  const controllerRef = useRef(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async ({ refresh = false } = {}) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((previous) => ({
      ...previous,
      status: previous.items.length ? previous.status : 'loading',
      refreshing: refresh,
      error: null,
    }));
    try {
      const data = await fetchNews({ refresh, signal: controller.signal });
      if (controller.signal.aborted) return;
      hasLoadedRef.current = true;
      setState({
        status: 'ready',
        items: data.items,
        meta: data,
        error: null,
        refreshing: false,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState((previous) => ({
        ...previous,
        status: 'error',
        refreshing: false,
        error: error.message || 'Не удалось загрузить новости',
      }));
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) load();
    return () => controllerRef.current?.abort();
  }, [load]);

  const refresh = useCallback(() => load({ refresh: true }), [load]);

  const value = useMemo(() => {
    const sources = state.meta?.sources || FALLBACK_SOURCES;
    const newsDocs = state.status === 'ready' ? buildNewsDocs(state.items) : [];
    return {
      ...state,
      sources,
      newsDocs,
      refresh,
      reload: load,
    };
  }, [state, refresh, load]);

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

export function useNews() {
  const context = useContext(NewsContext);
  if (!context) throw new Error('useNews должен использоваться внутри NewsProvider');
  return context;
}
