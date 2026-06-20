import { create } from "zustand";
import { getHistory, type HistoryItem } from "../services/history";

interface HistoryState {
  items: HistoryItem[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  fetch: (page?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  totalPages: 0,
  loading: false,
  refreshing: false,
  error: null,

  fetch: async (page?: number) => {
    const p = page ?? get().page;
    set({ loading: p === 1, error: null });

    try {
      const data = await getHistory(p);
      set({
        items: p === 1 ? data.items : [...get().items, ...data.items],
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
        loading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load history", loading: false });
    }
  },

  refresh: async () => {
    set({ refreshing: true });
    try {
      const data = await getHistory(1);
      set({
        items: data.items,
        total: data.total,
        page: 1,
        totalPages: data.totalPages,
        refreshing: false,
        error: null,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to refresh", refreshing: false });
    }
  },
}));
