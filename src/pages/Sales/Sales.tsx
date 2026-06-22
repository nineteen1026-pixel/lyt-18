import { useEffect, useState } from 'react';
import { Plus, Trash2, Search, TrendingUp, TrendingDown, Wallet, Percent, RotateCcw, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { api } from '../../utils/api';
import { PLATFORM_LABELS, PLATFORM_COLORS, SALE_STATUS_LABELS, SALE_STATUS_COLORS } from '../../../shared/types';
import { formatCurrency, formatDate, getProfitColor, formatProfit } from '../../utils/format';
import Modal from '../../components/Modal/Modal';

const REFUND_REASONS = [
  '商品质量问题',
  '与描述不符',
  '买家反悔',
  '物流损坏',
  '尺码/规格不合适',
  '其他原因',
];

export default function Sales() {
  const { sales, loading, fetchSales, items, listings, fetchItems, fetchListings } = useStore();
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    itemId: '',
    listingId: '',
    platform: 'xianyu',
    salePrice: '',
    saleDate: new Date().toISOString().split('T')[0],
    shippingFee: '',
    buyerInfo: '',
    note: '',
  });
  const [refundForm, setRefundForm] = useState({
    refundDate: new Date().toISOString().split('T')[0],
    refundReason: '',
    refundNote: '',
    targetStatus: 'holding' as 'holding' | 'listing',
  });

  useEffect(() => {
    fetchSales({
      platform: platformFilter !== 'all' ? platformFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    });
    fetchItems();
    fetchListings();
  }, [fetchSales, fetchItems, fetchListings, platformFilter, statusFilter]);

  const filteredSales = sales.filter((sale) => {
    const searchMatch = searchQuery === '' ||
      sale.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.buyerInfo?.toLowerCase().includes(searchQuery.toLowerCase());
    return searchMatch;
  });

  const activeSales = sales.filter(s => s.status === 'active');
  const availableItems = items.filter(i => i.status !== 'sold');
  const availableListings = listings.filter(l => l.status === 'active');

  const totalProfit = activeSales.reduce((sum, s) => sum + s.profit, 0);
  const totalIncome = activeSales.reduce((sum, s) => sum + (s.salePrice - (s.shippingFee || 0)), 0);
  const totalCosts = activeSales.reduce((sum, s) => sum + s.totalCost, 0);
  const avgGrossMargin = activeSales.length > 0
    ? Math.round(activeSales.reduce((sum, s) => sum + (s.grossMargin || 0), 0) / activeSales.length)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        itemId: Number(formData.itemId),
        listingId: formData.listingId ? Number(formData.listingId) : null,
        salePrice: Number(formData.salePrice),
        shippingFee: formData.shippingFee ? Number(formData.shippingFee) : 0,
      };
      await api.sales.create(data);
      setModalOpen(false);
      fetchSales();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleOpenRefund = (id: number) => {
    setSelectedSale(id);
    setRefundForm({
      refundDate: new Date().toISOString().split('T')[0],
      refundReason: '',
      refundNote: '',
      targetStatus: 'holding',
    });
    setRefundModalOpen(true);
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;
    if (confirm('确认退货？该操作将扣除对应收入和利润统计，恢复物品状态。')) {
      try {
        await api.sales.refund(selectedSale, {
          ...refundForm,
          refundReason: refundForm.refundReason || undefined,
          refundNote: refundForm.refundNote || undefined,
        });
        setRefundModalOpen(false);
        setSelectedSale(null);
        fetchSales();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这条成交记录吗？物品状态将会恢复。')) {
      try {
        await api.sales.delete(id);
        fetchSales();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  if (loading.sales) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const selectedSaleData = selectedSale ? sales.find(s => s.id === selectedSale) : null;
  const hasListing = selectedSaleData?.listingId != null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">成交记录</h1>
          <p className="text-slate-500 text-sm">查看和管理所有成交记录，净利润已扣除附加成本；退货记录将从统计中自动扣除</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          录入成交
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">成交笔数</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{activeSales.length}</p>
              {sales.length > activeSales.length && (
                <p className="text-xs text-slate-400 mt-1">含 {sales.length - activeSales.length} 笔已退货</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-blue-50">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">成交总额</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">综合成本</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalCosts)}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50">
              <Wallet className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">净利润</p>
              <div>
                <p className={`text-2xl font-bold mt-1 ${getProfitColor(totalProfit)}`}>
                  {formatProfit(totalProfit)}
                </p>
                <p className={`text-xs mt-1 ${getProfitColor(avgGrossMargin)} flex items-center gap-1`}>
                  <Percent className="w-3 h-3" />
                  平均毛利率 {avgGrossMargin > 0 ? '+' : ''}{avgGrossMargin}%
                </p>
              </div>
            </div>
            <div className={`p-3 rounded-xl ${totalProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              {totalProfit >= 0 ? (
                <TrendingUp className={`w-6 h-6 ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
              ) : (
                <TrendingDown className="w-6 h-6 text-rose-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索物品或买家..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full sm:w-auto"
          >
            <option value="all">全部状态</option>
            <option value="active">已成交</option>
            <option value="refunded">已退货</option>
          </select>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="input-field w-full sm:w-auto"
          >
            <option value="all">全部平台</option>
            {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">物品</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">平台</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">成交价</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">综合成本</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">净利润</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">毛利率</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">成交日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className={`hover:bg-slate-50 transition-colors ${sale.status === 'refunded' ? 'bg-rose-50/30' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg">
                        {sale.itemName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{sale.itemName}</div>
                        <div className="text-xs text-slate-500">
                          买入 {formatCurrency(sale.buyPrice)}
                          {sale.totalCosts > 0 && ` · 附加 ${formatCurrency(sale.totalCosts)}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="platform-tag text-white"
                      style={{ backgroundColor: PLATFORM_COLORS[sale.platform] }}
                    >
                      {PLATFORM_LABELS[sale.platform]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`font-bold ${sale.status === 'refunded' ? 'text-slate-400 line-through' : 'text-primary-600'}`}>
                      {formatCurrency(sale.salePrice)}
                    </div>
                    {sale.shippingFee ? (
                      <div className="text-xs text-slate-500">含运费 {formatCurrency(sale.shippingFee)}</div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`font-bold ${sale.status === 'refunded' ? 'text-slate-400' : 'text-rose-600'}`}>
                      {formatCurrency(sale.totalCost)}
                    </div>
                    {sale.totalCosts > 0 && (
                      <div className="text-xs text-slate-500">+{formatCurrency(sale.totalCosts)} 附加</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-bold ${sale.status === 'refunded' ? 'text-slate-400 line-through' : getProfitColor(sale.profit)}`}>
                      {formatProfit(sale.profit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sale.grossMargin !== undefined && (
                      <span className={`font-medium text-sm ${sale.status === 'refunded' ? 'text-slate-400' : getProfitColor(sale.grossMargin)}`}>
                        {sale.grossMargin > 0 ? '+' : ''}{sale.grossMargin}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <div>{formatDate(sale.saleDate)}</div>
                    {sale.status === 'refunded' && sale.refundDate && (
                      <div className="text-xs text-rose-500 mt-1">退货 {formatDate(sale.refundDate)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SALE_STATUS_COLORS[sale.status]}`}>
                      {SALE_STATUS_LABELS[sale.status]}
                    </span>
                    {sale.status === 'refunded' && sale.refundReason && (
                      <div className="text-xs text-slate-500 mt-1 max-w-[120px] truncate" title={sale.refundReason}>
                        {sale.refundReason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1">
                      {sale.status === 'active' && (
                        <button
                          onClick={() => handleOpenRefund(sale.id)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="退货退款"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-500">暂无成交记录</p>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="录入成交">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">选择物品</label>
            <select
              value={formData.itemId}
              onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
              className="input-field"
              required
            >
              <option value="">请选择物品</option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (综合成本 {formatCurrency(item.totalCost)}
                  {item.totalCosts > 0 && `，附加 ${formatCurrency(item.totalCosts)}`})
                </option>
              ))}
            </select>
          </div>
          {formData.itemId && items.find(i => i.id === Number(formData.itemId)) && (() => {
            const selectedItem = items.find(i => i.id === Number(formData.itemId))!;
            const breakdown = selectedItem.costsBreakdown || {
              shipping: 0, repair: 0, accessory: 0, cleaning: 0, other: 0,
            };
            const costLabels: Array<[keyof typeof breakdown, string, string]> = [
              ['shipping', '运费', 'bg-amber-500'],
              ['repair', '维修', 'bg-orange-500'],
              ['accessory', '配件', 'bg-violet-500'],
              ['cleaning', '清洁', 'bg-teal-500'],
              ['other', '其他', 'bg-slate-500'],
            ];
            return (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  综合成本构成
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">买入价</span>
                    <span className="font-medium text-primary-600">{formatCurrency(selectedItem.buyPrice)}</span>
                  </div>
                  {costLabels.map(([key, label, _color]) => (
                    breakdown[key] > 0 && (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-slate-500">{label}</span>
                        <span className="text-slate-700">+{formatCurrency(breakdown[key])}</span>
                      </div>
                    )
                  ))}
                  <div className="border-t border-slate-200 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">综合成本总计</span>
                    <span className="font-bold text-rose-600">{formatCurrency(selectedItem.totalCost)}</span>
                  </div>
                  {selectedItem.totalCosts > 0 && (
                    <div className="text-xs text-slate-400 text-right">
                      附加成本占比 {Math.round(selectedItem.totalCosts / selectedItem.totalCost * 100)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          {formData.itemId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">关联挂售（可选）</label>
              <select
                value={formData.listingId}
                onChange={(e) => {
                  setFormData({ ...formData, listingId: e.target.value });
                  const selected = availableListings.find(l => l.id === Number(e.target.value));
                  if (selected) {
                    setFormData(prev => ({
                      ...prev,
                      platform: selected.platform,
                      salePrice: String(selected.price),
                    }));
                  }
                }}
                className="input-field"
              >
                <option value="">不关联挂售</option>
                {availableListings.filter(l => l.itemId === Number(formData.itemId)).map((listing) => (
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
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
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
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
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
                value={formData.saleDate}
                onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">成交运费</label>
              <input
                type="number"
                value={formData.shippingFee}
                onChange={(e) => setFormData({ ...formData, shippingFee: e.target.value })}
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
              value={formData.buyerInfo}
              onChange={(e) => setFormData({ ...formData, buyerInfo: e.target.value })}
              className="input-field"
              placeholder="买家昵称、联系方式等..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="input-field min-h-[60px]"
              placeholder="交易过程中的特殊情况..."
            />
          </div>
          {formData.itemId && formData.salePrice && items.find(i => i.id === Number(formData.itemId)) && (() => {
            const selectedItem = items.find(i => i.id === Number(formData.itemId))!;
            const salePrice = Number(formData.salePrice);
            const shippingFee = formData.shippingFee ? Number(formData.shippingFee) : 0;
            const netIncome = salePrice - shippingFee;
            const netProfit = netIncome - selectedItem.totalCost;
            const grossMargin = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;
            return (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  收益预览
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">成交价</span>
                    <span className="font-medium text-slate-700">{formatCurrency(salePrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">成交运费</span>
                    <span className="text-slate-600">- {formatCurrency(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">净收入</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(netIncome)}</span>
                  </div>
                  <div className="border-t border-emerald-200 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">综合成本</span>
                    <span className="text-slate-700 font-medium">- {formatCurrency(selectedItem.totalCost)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-medium text-slate-700">净利润</span>
                    <span className={`font-bold text-lg ${getProfitColor(netProfit)}`}>
                      {formatProfit(netProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      毛利率
                    </span>
                    <span className={`font-bold ${getProfitColor(grossMargin)}`}>
                      {grossMargin > 0 ? '+' : ''}{grossMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1">
              确认成交
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={refundModalOpen} onClose={() => { setRefundModalOpen(false); setSelectedSale(null); }} title="退货退款">
        <form onSubmit={handleRefund} className="space-y-4">
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 space-y-1">
              <p className="font-medium">确认退货后：</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                <li>该订单的收入、利润、成交计数将从统计中扣除</li>
                <li>关联的物品状态将恢复为您选择的状态</li>
                <li>退货操作不可撤销，请谨慎操作</li>
              </ul>
            </div>
          </div>

          {selectedSaleData && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-2">订单信息</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">物品：</span>
                  <span className="font-medium text-slate-800">{selectedSaleData.itemName}</span>
                </div>
                <div>
                  <span className="text-slate-500">平台：</span>
                  <span className="font-medium text-slate-800">{PLATFORM_LABELS[selectedSaleData.platform]}</span>
                </div>
                <div>
                  <span className="text-slate-500">成交价：</span>
                  <span className="font-bold text-primary-600">{formatCurrency(selectedSaleData.salePrice)}</span>
                </div>
                <div>
                  <span className="text-slate-500">净利润：</span>
                  <span className={`font-bold ${getProfitColor(selectedSaleData.profit)}`}>
                    {formatProfit(selectedSaleData.profit)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">退货日期</label>
            <input
              type="date"
              value={refundForm.refundDate}
              onChange={(e) => setRefundForm({ ...refundForm, refundDate: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">退货原因</label>
            <select
              value={refundForm.refundReason}
              onChange={(e) => setRefundForm({ ...refundForm, refundReason: e.target.value })}
              className="input-field"
            >
              <option value="">请选择原因（可选）</option>
              {REFUND_REASONS.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">恢复物品状态至</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                refundForm.targetStatus === 'holding'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="targetStatus"
                  value="holding"
                  checked={refundForm.targetStatus === 'holding'}
                  onChange={(e) => setRefundForm({ ...refundForm, targetStatus: e.target.value as 'holding' | 'listing' })}
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <div className="font-medium text-slate-800">持有中</div>
                  <div className="text-xs text-slate-500">物品暂不出售，留作自用</div>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                refundForm.targetStatus === 'listing'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300'
              } ${!hasListing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="radio"
                  name="targetStatus"
                  value="listing"
                  checked={refundForm.targetStatus === 'listing'}
                  onChange={(e) => hasListing && setRefundForm({ ...refundForm, targetStatus: e.target.value as 'holding' | 'listing' })}
                  disabled={!hasListing}
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <div className="font-medium text-slate-800">挂售中</div>
                  <div className="text-xs text-slate-500">
                    {hasListing ? '恢复原挂售链接继续出售' : '该订单未关联挂售，无法选择'}
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">退货备注</label>
            <textarea
              value={refundForm.refundNote}
              onChange={(e) => setRefundForm({ ...refundForm, refundNote: e.target.value })}
              className="input-field min-h-[60px]"
              placeholder="退货过程中的特殊情况、协商结果等..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setRefundModalOpen(false); setSelectedSale(null); }}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button type="submit" className="btn-danger flex-1 flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              确认退货
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
