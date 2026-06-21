import type { ApiResponse } from '../../shared/types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (result.code !== 0) {
    throw new Error(result.message || '请求失败');
  }

  return result.data;
}

export const api = {
  items: {
    getList: (params?: { status?: string; category?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      const query = searchParams.toString();
      return request(`/items${query ? `?${query}` : ''}`);
    },
    getById: (id: number) => request(`/items/${id}`),
    create: (data: any) => request('/items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/items/${id}`, { method: 'DELETE' }),
    addUsage: (id: number, data: { content: string; date: string }) =>
      request(`/items/${id}/usage`, { method: 'POST', body: JSON.stringify(data) }),
    getCosts: (id: number) => request(`/items/${id}/costs`),
    addCost: (id: number, data: { type: string; amount: number; note?: string; date: string }) =>
      request(`/items/${id}/costs`, { method: 'POST', body: JSON.stringify(data) }),
    deleteCost: (id: number, costId: number) =>
      request(`/items/${id}/costs/${costId}`, { method: 'DELETE' }),
  },
  listings: {
    getList: (params?: { platform?: string; status?: string; itemId?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.platform) searchParams.set('platform', params.platform);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.itemId) searchParams.set('itemId', String(params.itemId));
      const query = searchParams.toString();
      return request(`/listings${query ? `?${query}` : ''}`);
    },
    create: (data: any) => request('/listings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/listings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/listings/${id}`, { method: 'DELETE' }),
  },
  sales: {
    getList: (params?: { platform?: string; itemId?: number; startDate?: string; endDate?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.platform) searchParams.set('platform', params.platform);
      if (params?.itemId) searchParams.set('itemId', String(params.itemId));
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      const query = searchParams.toString();
      return request(`/sales${query ? `?${query}` : ''}`);
    },
    create: (data: any) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/sales/${id}`, { method: 'DELETE' }),
  },
  offers: {
    getList: (params?: { listingId?: number; itemId?: number; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.listingId) searchParams.set('listingId', String(params.listingId));
      if (params?.itemId) searchParams.set('itemId', String(params.itemId));
      if (params?.status) searchParams.set('status', params.status);
      const query = searchParams.toString();
      return request(`/offers${query ? `?${query}` : ''}`);
    },
    getById: (id: number) => request(`/offers/${id}`),
    create: (data: any) => request('/offers', { method: 'POST', body: JSON.stringify(data) }),
    counter: (id: number, data: { counterPrice: number; comment?: string }) =>
      request(`/offers/${id}/counter`, { method: 'POST', body: JSON.stringify(data) }),
    accept: (id: number, data?: { comment?: string }) =>
      request(`/offers/${id}/accept`, { method: 'POST', body: JSON.stringify(data || {}) }),
    reject: (id: number, data?: { comment?: string }) =>
      request(`/offers/${id}/reject`, { method: 'POST', body: JSON.stringify(data || {}) }),
    createSale: (id: number, data?: { saleDate?: string; shippingFee?: number; note?: string }) =>
      request(`/offers/${id}/create-sale`, { method: 'POST', body: JSON.stringify(data || {}) }),
    delete: (id: number) => request(`/offers/${id}`, { method: 'DELETE' }),
  },
  stats: {
    getSummary: () => request('/stats/summary'),
    getMonthly: () => request('/stats/monthly'),
    getPlatform: () => request('/stats/platform'),
    getCategory: () => request('/stats/category'),
  },
};
