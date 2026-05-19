import { useState, useCallback } from 'react';

export interface TableState {
  offset: number;
  hasMore: boolean;
  loading: boolean;
  search: string;
  filter: string;
  total: number | null;
}

export const defaultTableState = (): TableState => ({
  offset: 0,
  hasMore: true,
  loading: false,
  search: '',
  filter: '',
  total: null,
});

export function useTableState(initial?: Partial<TableState>) {
  const [state, setState] = useState<TableState>({ ...defaultTableState(), ...initial });

  const reset = useCallback(() => {
    setState(prev => ({
      ...defaultTableState(),
      search: prev.search,
      filter: prev.filter,
    }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setState(prev => ({ ...prev, search }));
  }, []);

  const setFilter = useCallback((filter: string) => {
    setState(prev => ({ ...prev, filter }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const afterFetch = useCallback((rowsReturned: number, total: number | null, batchSize: number) => {
    setState(prev => {
      const newOffset = prev.offset + rowsReturned;
      const newHasMore = rowsReturned >= batchSize;
      return {
        ...prev,
        loading: false,
        offset: newOffset,
        hasMore: newHasMore,
        total: prev.total === null && total !== null ? total : prev.total,
      };
    });
  }, []);

  return { state, setState, reset, setSearch, setFilter, setLoading, afterFetch };
}
