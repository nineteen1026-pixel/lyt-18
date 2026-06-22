import { create } from 'zustand';
import { api } from '../utils/api';
import type { ItemWithStats, ListingWithItem, SaleWithItem, StatsSummary, MonthlyData, PlatformData, CategoryData, OfferWithDetails } from '../../shared/types';

interface AppState {
  items: ItemWithStats[];
  listings: ListingWithItem[];
  sales: SaleWithItem[];
  offers: OfferWithDetails[];
  stats: {
    summary: StatsSummary | null;
    monthly: MonthlyData[];
    platform: PlatformData[];
    category: CategoryData[];
  };
  loading: {
    items: boolean;
    listings: boolean;
    sales: boolean;
    offers: boolean;
    stats: boolean;
  };
  error: string | null;
  fetchItems: (params?: { status?: string; category?: string; search?: string }) => Promise<void>;
  fetchListings: (params?: { platform?: string; status?: string; itemId?: number }) => Promise<void>;
  fetchSales: (params?: { platform?: string; itemId?: number; startDate?: string; endDate?: string; status?: string }) => Promise<void>;
  fetchOffers: (params?: { listingId?: number; itemId?: number; status?: string }) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchAll: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  items: [],
  listings: [],
  sales: [],
  offers: [],
  stats: {
    summary: null,
    monthly: [],
    platform: [],
    category: [],
  },
  loading: {
    items: false,
    listings: false,
    sales: false,
    offers: false,
    stats: false,
  },
  error: null,

  fetchItems: async (params) => {
    set({ loading: { ...get().loading, items: true } });
    try {
      const data = await api.items.getList(params) as ItemWithStats[];
      set({ items: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: { ...get().loading, items: false } });
    }
  },

  fetchListings: async (params) => {
    set({ loading: { ...get().loading, listings: true } });
    try {
      const data = await api.listings.getList(params) as ListingWithItem[];
      set({ listings: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: { ...get().loading, listings: false } });
    }
  },

  fetchSales: async (params) => {
    set({ loading: { ...get().loading, sales: true } });
    try {
      const data = await api.sales.getList(params) as SaleWithItem[];
      set({ sales: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: { ...get().loading, sales: false } });
    }
  },

  fetchOffers: async (params) => {
    set({ loading: { ...get().loading, offers: true } });
    try {
      const data = await api.offers.getList(params) as OfferWithDetails[];
      set({ offers: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: { ...get().loading, offers: false } });
    }
  },

  fetchStats: async () => {
    set({ loading: { ...get().loading, stats: true } });
    try {
      const [summary, monthly, platform, category] = await Promise.all([
        api.stats.getSummary() as Promise<StatsSummary>,
        api.stats.getMonthly() as Promise<MonthlyData[]>,
        api.stats.getPlatform() as Promise<PlatformData[]>,
        api.stats.getCategory() as Promise<CategoryData[]>,
      ]);
      set({
        stats: { summary, monthly, platform, category },
        error: null,
      });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: { ...get().loading, stats: false } });
    }
  },

  fetchAll: async () => {
    await Promise.all([
      get().fetchItems(),
      get().fetchListings(),
      get().fetchSales(),
      get().fetchStats(),
    ]);
  },
}));
