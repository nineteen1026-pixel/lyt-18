import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Package, Plus, Trash2, Clock, DollarSign, TrendingUp, Wallet, Wrench, Truck, Sparkles, ShoppingCart, Percent } from 'lucide-react';
import { api } from '../../utils/api';
import { STATUS_LABELS, STATUS_COLORS, PLATFORM_LABELS, PLATFORM_COLORS, LISTING_STATUS_LABELS, COST_TYPE_LABELS, COST_TYPE_COLORS, type ItemCost, type CostType } from '../../../shared/types';
import { formatCurrency, formatDate, formatDays, getProgressColor, getProfitColor, formatProfit } from '../../utils/format';
import Modal from '../../components/Modal/Modal';

interface ItemDetailData {
  id: number;
  name: string;
  category: string;
  buyPrice: number;
  buyDate: string;
  image?: string;
  description?: string;
  status: string;
  holdingDays: number;
  currentValue: number;
  returnProgress: number;
  totalCosts: number;
  costsBreakdown: Record<CostType, number>;
  totalCost: number;
  grossMargin?: number;
  netProfit?: number;
  costs?: ItemCost[];
  sale?: any;
  usageRecords: any[];
  listings: any[];
}

const COST_TYPE_ICONS: Record<CostType, typeof Truck> = {
  shipping: Truck,
  repair: Wrench,
  accessory: ShoppingCart,
  cleaning: Sparkles,
  other: Wallet,
};

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<ItemDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [listingForm, setListingForm] = useState({
    platform: 'xianyu',
    price: '',
    listDate: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [saleForm, setSaleForm] = useState({
    listingId: '',
    platform: 'xianyu',
    salePrice: '',
    saleDate: new Date().toISOString().split('T')[0],
    shippingFee: '',
    buyerInfo: '',
    note: '',
  });
  const [usageForm, setUsageForm] = useState({
    content: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [costForm, setCostForm] = useState({
    type: 'shipping' as CostType,
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchItemDetail();
  }, [id]);

  const fetchItemDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.items.getById(Number(id)) as ItemDetailData;
      setItem(data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    try {
      await api.listings.create({
        itemId: item.id,
        ...listingForm,
        price: Number(listingForm.price),
      });
      setListingModalOpen(false);
      fetchItemDetail();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    try {
      await api.sales.create({
        itemId: item.id,
        listingId: saleForm.listingId ? Number(saleForm.listingId) : null,
        platform: saleForm.platform,
        salePrice: Number(saleForm.salePrice),
        saleDate: saleForm.saleDate,
        shippingFee: saleForm.shippingFee ? Number(saleForm.shippingFee) : 0,
        buyerInfo: saleForm.buyerInfo,
        note: saleForm.note,
      });
      setSaleModalOpen(false);
      fetchItemDetail();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAddUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    try {
      await api.items.addUsage(item.id, usageForm);
      setUsageModalOpen(false);
      setUsageForm({ content: '', date: new Date().toISOString().split('T')[0] });
      fetchItemDetail();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    try {
      await api.items.addCost(item.id, {
        type: costForm.type,
        amount: Number(costForm.amount),
        note: costForm.note,
        date: costForm.date,
      });
      setCostModalOpen(false);
      setCostForm({
        type: 'shipping',
        amount: '',
        note: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchItemDetail();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDeleteCost = async (costId: number) => {
    if (!item) return;
    if (confirm('确定要删除这条成本记录吗？')) {
      try {
        await api.items.deleteCost(item.id, costId);
        fetchItemDetail();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  const handleDeleteListing = async (listingId: number) => {
    if (confirm('确定要删除这条挂售记录吗？')) {
      try {
        await api.listings.delete(listingId);
        fetchItemDetail();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">物品不存在</p>
      </div>
    );
  }

  const imageUrl = item.image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(item.name + ' ' + item.category)}&image_size=square`;

  const costEntries = Object.entries(item.costsBreakdown).filter(([, v]) => v > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/items')}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{item.name}</h1>
          <p className="text-slate-500 text-sm">{item.category}</p>
        </div>
        <span className={`status-badge ${STATUS_COLORS[item.status as keyof typeof STATUS_COLORS]}`}>
          {STATUS_LABELS[item.status as keyof typeof STATUS_LABELS]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="h-48 bg-slate-100">
              <img
                src={imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(item.name)}`;
                }}
              />
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">买入价格</p>
                <p className="text-xl font-bold text-primary-600">{formatCurrency(item.buyPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">附加成本</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-rose-500">{formatCurrency(item.totalCosts)}</p>
                  {item.totalCosts > 0 && (
                    <span className="text-xs text-slate-500">
                      +{Math.round((item.totalCosts / item.buyPrice) * 100)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">综合成本总计</p>
                <p className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-slate-600" />
                  {formatCurrency(item.totalCost)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">持有时长</p>
                <p className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatDays(item.holdingDays)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">当前估值</p>
                <p className="text-lg font-bold text-amber-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(item.currentValue)}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    回本进度
                  </p>
                  <p className="text-sm font-bold text-slate-700">{item.returnProgress}%</p>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getProgressColor(item.returnProgress)}`}
                    style={{ width: `${item.returnProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">基于综合成本 {formatCurrency(item.totalCost)} 计算</p>
              </div>
            </div>
          </div>

          {item.sale && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
              <p className="text-sm font-medium text-emerald-700 mb-3 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                已成交
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-600">成交价</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(item.sale.salePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">成交运费</span>
                  <span className="text-emerald-700">{formatCurrency(item.sale.shippingFee || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-emerald-200">
                  <span className="text-emerald-600">实际收入</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(item.sale.salePrice - (item.sale.shippingFee || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">买入成本</span>
                  <span className="text-emerald-700">{formatCurrency(item.buyPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">附加成本</span>
                  <span className="text-emerald-700">{formatCurrency(item.totalCosts)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-emerald-200">
                  <span className="text-emerald-600 font-medium">净利润</span>
                  <span className={`font-bold text-lg ${getProfitColor(item.netProfit ?? 0)}`}>
                    {formatProfit(item.netProfit ?? 0)}
                  </span>
                </div>
                {item.grossMargin !== undefined && (
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      毛利率
                    </span>
                    <span className={`font-bold text-lg ${getProfitColor(item.grossMargin)}`}>
                      {item.grossMargin > 0 ? '+' : ''}{item.grossMargin}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm">成本构成</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary-500"></div>
                  <span className="text-slate-600">买入价格</span>
                </div>
                <span className="font-medium text-slate-700">
                  {formatCurrency(item.buyPrice)}
                  <span className="text-xs text-slate-400 ml-1">
                    ({item.totalCost > 0 ? Math.round((item.buyPrice / item.totalCost) * 100) : 0}%)
                  </span>
                </span>
              </div>
              {costEntries.map(([type, amount]) => {
                const Icon = COST_TYPE_ICONS[type as CostType];
                return (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: COST_TYPE_COLORS[type as CostType] }}></div>
                      <span className="text-slate-600 flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        {COST_TYPE_LABELS[type as CostType]}
                      </span>
                    </div>
                    <span className="font-medium text-slate-700">
                      {formatCurrency(amount)}
                      <span className="text-xs text-slate-400 ml-1">
                        ({item.totalCost > 0 ? Math.round((amount / item.totalCost) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                );
              })}
              <div className="h-4 mt-3 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  className="h-full bg-primary-500"
                  style={{ width: `${item.totalCost > 0 ? (item.buyPrice / item.totalCost) * 100 : 0}%` }}
                />
                {costEntries.map(([type, amount]) => (
                  <div
                    key={type}
                    className="h-full"
                    style={{
                      width: `${item.totalCost > 0 ? (amount / item.totalCost) * 100 : 0}%`,
                      backgroundColor: COST_TYPE_COLORS[type as CostType],
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {item.status !== 'sold' && (
              <>
                <button
                  onClick={() => setListingModalOpen(true)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  发起挂售
                </button>
                <button
                  onClick={() => setSaleModalOpen(true)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  录入成交
                </button>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {item.description && (
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-2">物品描述</h3>
              <p className="text-slate-600 text-sm">{item.description}</p>
            </div>
          )}

          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-rose-600" />
                附加成本明细
              </h3>
              <button
                onClick={() => setCostModalOpen(true)}
                className="text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                添加成本
              </button>
            </div>
            {!item.costs || item.costs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">暂无附加成本记录</p>
            ) : (
              <div className="space-y-3">
                {item.costs.map((cost) => {
                  const Icon = COST_TYPE_ICONS[cost.type];
                  return (
                    <div key={cost.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: COST_TYPE_COLORS[cost.type] }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {COST_TYPE_LABELS[cost.type]}
                            <span className="text-rose-600 ml-3 font-bold">{formatCurrency(cost.amount)}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(cost.date)}
                            {cost.note && ` · ${cost.note}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCost(cost.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                使用记录
              </h3>
              <button
                onClick={() => setUsageModalOpen(true)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                添加记录
              </button>
            </div>
            {item.usageRecords.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">暂无使用记录</p>
            ) : (
              <div className="space-y-3">
                {item.usageRecords.map((record) => (
                  <div key={record.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800">{record.content}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(record.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" />
              挂售记录
            </h3>
            {item.listings.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">暂无挂售记录</p>
            ) : (
              <div className="space-y-3">
                {item.listings.map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: PLATFORM_COLORS[listing.platform] }}
                      >
                        {PLATFORM_LABELS[listing.platform].charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{PLATFORM_LABELS[listing.platform]}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(listing.listDate)} 挂售 · 报价 {formatCurrency(listing.price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="status-badge bg-blue-100 text-blue-700">
                        {LISTING_STATUS_LABELS[listing.status]}
                      </span>
                      {listing.status !== 'sold' && (
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={listingModalOpen} onClose={() => setListingModalOpen(false)} title="发起挂售">
        <form onSubmit={handleAddListing} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">挂售平台</label>
            <select
              value={listingForm.platform}
              onChange={(e) => setListingForm({ ...listingForm, platform: e.target.value })}
              className="input-field"
            >
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">挂售价格</label>
            <input
              type="number"
              value={listingForm.price}
              onChange={(e) => setListingForm({ ...listingForm, price: e.target.value })}
              className="input-field"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">挂售日期</label>
            <input
              type="date"
              value={listingForm.listDate}
              onChange={(e) => setListingForm({ ...listingForm, listDate: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea
              value={listingForm.note}
              onChange={(e) => setListingForm({ ...listingForm, note: e.target.value })}
              className="input-field min-h-[60px]"
              placeholder="是否包邮、议价说明等..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setListingModalOpen(false)} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1">
              确认挂售
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={saleModalOpen} onClose={() => setSaleModalOpen(false)} title="录入成交">
        <form onSubmit={handleAddSale} className="space-y-4">
          {item.listings.filter(l => l.status === 'active').length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">关联挂售（可选）</label>
              <select
                value={saleForm.listingId}
                onChange={(e) => {
                  setSaleForm({ ...saleForm, listingId: e.target.value });
                  const selected = item.listings.find(l => l.id === Number(e.target.value));
                  if (selected) {
                    setSaleForm(prev => ({ ...prev, platform: selected.platform, salePrice: String(selected.price) }));
                  }
                }}
                className="input-field"
              >
                <option value="">不关联挂售</option>
                {item.listings.filter(l => l.status === 'active').map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {PLATFORM_LABELS[listing.platform]} - {formatCurrency(listing.price)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">成交平台</label>
            <select
              value={saleForm.platform}
              onChange={(e) => setSaleForm({ ...saleForm, platform: e.target.value })}
              className="input-field"
            >
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">成交价格</label>
            <input
              type="number"
              value={saleForm.salePrice}
              onChange={(e) => setSaleForm({ ...saleForm, salePrice: e.target.value })}
              className="input-field"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">成交日期</label>
              <input
                type="date"
                value={saleForm.saleDate}
                onChange={(e) => setSaleForm({ ...saleForm, saleDate: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">成交运费</label>
              <input
                type="number"
                value={saleForm.shippingFee}
                onChange={(e) => setSaleForm({ ...saleForm, shippingFee: e.target.value })}
                className="input-field"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">买家信息</label>
            <input
              type="text"
              value={saleForm.buyerInfo}
              onChange={(e) => setSaleForm({ ...saleForm, buyerInfo: e.target.value })}
              className="input-field"
              placeholder="买家昵称、联系方式等..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea
              value={saleForm.note}
              onChange={(e) => setSaleForm({ ...saleForm, note: e.target.value })}
              className="input-field min-h-[60px]"
              placeholder="交易过程中的特殊情况..."
            />
          </div>
          {item && saleForm.salePrice && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-3">收益预览</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">成交价</span>
                  <span className="font-medium text-slate-700">{formatCurrency(Number(saleForm.salePrice))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">成交运费</span>
                  <span className="text-slate-600">- {formatCurrency(saleForm.shippingFee ? Number(saleForm.shippingFee) : 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">净收入</span>
                  <span className="font-medium text-emerald-600">
                    {formatCurrency(Number(saleForm.salePrice) - (saleForm.shippingFee ? Number(saleForm.shippingFee) : 0))}
                  </span>
                </div>
                <div className="border-t border-slate-200 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-slate-500">综合成本</span>
                  <span className="text-slate-600">{formatCurrency(item.totalCost)}</span>
                  <span className="text-xs text-slate-400">买入+附加</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">净利润</span>
                  <span className={`font-bold ${getProfitColor((Number(saleForm.salePrice) - (saleForm.shippingFee ? Number(saleForm.shippingFee) : 0)) - item.totalCost)}`}>
                    {formatProfit((Number(saleForm.salePrice) - (saleForm.shippingFee ? Number(saleForm.shippingFee) : 0)) - item.totalCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">毛利率</span>
                  <span className={`font-bold ${getProfitColor(Number(saleForm.salePrice) > 0 ? ((Number(saleForm.salePrice) - (saleForm.shippingFee ? Number(saleForm.shippingFee) : 0) - item.totalCost) / Number(saleForm.salePrice)) * 100 : 0)}`}>
                    {Number(saleForm.salePrice) > 0
                      ? `${((Number(saleForm.salePrice) - (saleForm.shippingFee ? Number(saleForm.shippingFee) : 0) - item.totalCost) / Number(saleForm.salePrice) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setSaleModalOpen(false)} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1">
              确认成交
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={usageModalOpen} onClose={() => setUsageModalOpen(false)} title="添加使用记录">
        <form onSubmit={handleAddUsage} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">记录内容</label>
            <textarea
              value={usageForm.content}
              onChange={(e) => setUsageForm({ ...usageForm, content: e.target.value })}
              className="input-field min-h-[80px]"
              placeholder="记录使用情况、保养、维修等..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">日期</label>
            <input
              type="date"
              value={usageForm.date}
              onChange={(e) => setUsageForm({ ...usageForm, date: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setUsageModalOpen(false)} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1">
              添加记录
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={costModalOpen} onClose={() => setCostModalOpen(false)} title="添加附加成本">
        <form onSubmit={handleAddCost} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">成本类型</label>
            <select
              value={costForm.type}
              onChange={(e) => setCostForm({ ...costForm, type: e.target.value as CostType })}
              className="input-field"
            >
              {Object.entries(COST_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">金额</label>
            <input
              type="number"
              value={costForm.amount}
              onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
              className="input-field"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">日期</label>
            <input
              type="date"
              value={costForm.date}
              onChange={(e) => setCostForm({ ...costForm, date: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea
              value={costForm.note}
              onChange={(e) => setCostForm({ ...costForm, note: e.target.value })}
              className="input-field min-h-[60px]"
              placeholder="费用说明、商家信息等..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCostModalOpen(false)} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1" style={{ backgroundColor: '#E11D48' }}>
              确认添加
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
