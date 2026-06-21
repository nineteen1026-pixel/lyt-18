export type ItemStatus = 'holding' | 'listing' | 'sold';

export type Platform = 'xianyu' | 'zhuanzhuan' | 'xiaohongshu' | 'pinduoduo' | 'other';

export type ListingStatus = 'active' | 'sold' | 'cancelled';

export interface Item {
  id: number;
  name: string;
  category: string;
  buyPrice: number;
  buyDate: string;
  image?: string;
  description?: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ItemWithStats extends Item {
  holdingDays: number;
  currentValue: number;
  returnProgress: number;
  sale?: Sale;
}

export interface UsageRecord {
  id: number;
  itemId: number;
  content: string;
  date: string;
  createdAt: string;
}

export interface Listing {
  id: number;
  itemId: number;
  platform: Platform;
  price: number;
  listDate: string;
  status: ListingStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingWithItem extends Listing {
  itemName: string;
  itemImage?: string;
}

export interface Sale {
  id: number;
  itemId: number;
  listingId?: number;
  platform: Platform;
  salePrice: number;
  saleDate: string;
  shippingFee?: number;
  buyerInfo?: string;
  note?: string;
  createdAt: string;
}

export interface SaleWithItem extends Sale {
  itemName: string;
  itemImage?: string;
  buyPrice: number;
  profit: number;
}

export interface StatsSummary {
  totalItems: number;
  holdingItems: number;
  listingItems: number;
  soldItems: number;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  returnRate: number;
  avgHoldingDays: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

export interface PlatformData {
  platform: Platform;
  count: number;
  amount: number;
}

export interface CategoryData {
  category: string;
  count: number;
  profit: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  xianyu: '闲鱼',
  zhuanzhuan: '转转',
  xiaohongshu: '小红书',
  pinduoduo: '拼多多',
  other: '其他',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  xianyu: '#FF6600',
  zhuanzhuan: '#00C250',
  xiaohongshu: '#FE2C55',
  pinduoduo: '#E02E24',
  other: '#6B7280',
};

export const STATUS_LABELS: Record<ItemStatus, string> = {
  holding: '持有中',
  listing: '挂售中',
  sold: '已成交',
};

export const STATUS_COLORS: Record<ItemStatus, string> = {
  holding: 'bg-amber-100 text-amber-700',
  listing: 'bg-blue-100 text-blue-700',
  sold: 'bg-emerald-100 text-emerald-700',
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  active: '挂售中',
  sold: '已售出',
  cancelled: '已取消',
};

export const CATEGORIES = [
  '数码产品',
  '家用电器',
  '家居家具',
  '游戏设备',
  '运动户外',
  '图书文具',
  '服饰箱包',
  '母婴用品',
  '其他',
];
