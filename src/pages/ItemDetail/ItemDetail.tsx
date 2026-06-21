import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Package, Plus, Trash2, Clock, DollarSign, TrendingUp, Wallet, Wrench, Truck, Sparkles, ShoppingCart, Percent, MessageSquare, Check, X, RefreshCw, ChevronDown, ChevronUp, User, Phone, FileText, History } from 'lucide-react';
import { api } from '../../utils/api';
import { STATUS_LABELS, STATUS_COLORS, PLATFORM_LABELS, PLATFORM_COLORS, LISTING_STATUS_LABELS, COST_TYPE_LABELS, COST_TYPE_COLORS, OFFER_STATUS_LABELS, OFFER_STATUS_COLORS, OFFER_ACTION_LABELS, OFFER_ACTOR_LABELS, type ItemCost, type CostType, type OfferWithDetails, type ListingWithItem } from '../../../shared/types';
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
  listings: ListingWithItem[];
  offers: OfferWithDetails[];
}

const COST_TYPE_ICONS: Record<CostType, typeof Truck> = {
  shipping: Truck,
  repair: Wrench,
  accessory: ShoppingCart,
  cleaning: Sparkles,
  other: Wallet,
};

type DetailModalMode = 'none' | 'listing' | 'sale' | 'usage' | 'cost' | 'offer' | 'counter' | 'reject' | 'history' | 'createSale';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<ItemDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<DetailModalMode>('none');
  const [expandedListingId, setExpandedListingId] = useState<number | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithDetails | null>(null);
  const [selectedListingForOffer, setSelectedListingForOffer] = useState<ListingWithItem | null>(null);
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
  const [offerForm, setOfferForm] = useState({
    buyerName: '',
    buyerContact: '',
    offerPrice: '',
    shippingFee: '',
    note: '',
  });
  const [counterForm, setCounterForm] = useState({ counterPrice: '', comment: '' });
  const [rejectForm, setRejectForm] = useState({ comment: '' });
  const [createSaleForm, setCreateSaleForm] = useState({
    saleDate: new Date().toISOString().split('T')[0],
    shippingFee: '',
    note: '',
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

  const closeModal = () => {
    setModalMode('none');
    setSelectedOffer(null);
    setSelectedListingForOffer(null);
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
      closeModal();
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
      closeModal();
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
      closeModal();
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
      closeModal();
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
    if (confirm('确定要删除这条挂售记录吗？相关出价也会被删除。')) {
      try {
        await api.listings.delete(listingId);
        fetchItemDetail();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  const openOfferModal = (listing: ListingWithItem) => {
    setSelectedListingForOffer(listing);
    setOfferForm({
      buyerName: '',
      buyerContact: '',
      offerPrice: String(listing.price),
      shippingFee: '',
      note: '',
    });
    setModalMode('offer');
  };

  const openCounterModal = (offer: OfferWithDetails) => {
    setSelectedOffer(offer);
    setCounterForm({
      counterPrice: String(offer.listingPrice),
      comment: '',
    });
    setModalMode('counter');
  };

  const openRejectModal = (offer: OfferWithDetails) => {
    setSelectedOffer(offer);
    setRejectForm({ comment: '' });
    setModalMode('reject');
  };

  const openHistoryModal = (offer: OfferWithDetails) => {
    setSelectedOffer(offer);
    setModalMode('history');
  };

  const openCreateSaleModal = (offer: OfferWithDetails) => {
    setSelectedOffer(offer);
    setCreateSaleForm({
      saleDate: new Date().toISOString().split('T')[0],
      shippingFee: String(offer.shippingFee || 0),
      note: '',
    });
    setModalMode('createSale');
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingForOffer) return;
    try {
      await api.offers.create({
        listingId: selectedListingForOffer.id,
        buyerName: offerForm.buyerName,
        buyerContact: offerForm.buyerContact || undefined,
        offerPrice: Number(offerForm.offerPrice),
        shippingFee: offerForm.shippingFee ? Number(offerForm.shippingFee) : 0,
        note: offerForm.note || undefined,
      });
      closeModal();
      fetchItemDetail();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAcceptOffer = async (offer: OfferWithDetails) => {
    if (confirm(`确定接受买家 ${offer.buyerName} 的出价 ${formatCurrency(offer.currentPrice)} 吗？`)) {
      try {
        await api.offers.accept(offer.id);
        fetchItemDetail();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  const handleSubmitCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;
    try {
      await api.offers.counter(selectedOffer.id, {
        counterPrice: Number(counterForm.counterPrice),
        comment: counterForm.comment || undefined,
      });
      closeModal();
      fetchItemDetail();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;
    try {
      await api.offers.reject(selectedOffer.id, {
        comment: rejectForm.comment || undefined,
      });
      closeModal();
      fetchItemDetail();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleSubmitCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;
    try {
      await api.offers.createSale(selectedOffer.id, {
        saleDate: createSaleForm.saleDate,
        shippingFee: createSaleForm.shippingFee ? Number(createSaleForm.shippingFee) : undefined,
        note: createSaleForm.note || undefined,
      });
      closeModal();
      fetchItemDetail();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDeleteOffer = async (offerId: number) => {
    if (confirm('确定要删除这条出价记录吗？')) {
      try {
        await api.offers.delete(offerId);
        fetchItemDetail();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  const getListingOffers = (listingId: number) => {
    return item?.offers.filter(o => o.listingId === listingId) || [];
  };

  const getPriceDiffColor = (offer: OfferWithDetails) => {
    const diff = offer.currentPrice - offer.listingPrice;
    if (diff >= 0) return 'text-emerald-600';
    if (diff >= -offer.listingPrice * 0.1) return 'text-amber-600';
    return 'text-rose-600';
  };

  const toggleExpandListing = (listingId: number) => {
    setExpandedListingId(expandedListingId === listingId ? null : listingId);
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

  const renderOfferCard = (offer: OfferWithDetails) => (
    <div
      key={offer.id}
      className="bg-white rounded-lg p-4 border border-slate-200 hover:border-primary-200 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${OFFER_STATUS_COLORS[offer.status]}`}>
              {OFFER_STATUS_LABELS[offer.status]}
            </span>
            <span className="flex items-center gap-1 text-sm text-slate-700 font-medium">
              <User className="w-4 h-4" />
              {offer.buyerName}
            </span>
            {offer.buyerContact && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Phone className="w-3 h-3" />
                {offer.buyerContact}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <div>
              <span className="text-xs text-slate-500">初始出价：</span>
              <span className="text-sm text-slate-600 line-through">{formatCurrency(offer.offerPrice)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500">当前价格：</span>
              <span className={`text-lg font-bold ${getPriceDiffColor(offer)}`}>
                {formatCurrency(offer.currentPrice)}
              </span>
              <span className={`text-xs ml-1 ${getPriceDiffColor(offer)}`}>
                ({offer.currentPrice >= offer.listingPrice ? '+' : ''}
                {formatCurrency(offer.currentPrice - offer.listingPrice)})
              </span>
            </div>
            {offer.shippingFee ? (
              <div>
                <span className="text-xs text-slate-500">运费：</span>
                <span className="text-sm text-slate-600">{formatCurrency(offer.shippingFee)}</span>
              </div>
            ) : null}
            <div>
              <span className="text-xs text-slate-500">挂售价：</span>
              <span className="text-sm text-slate-600">{formatCurrency(offer.listingPrice)}</span>
            </div>
          </div>
          {offer.note && (
            <div className="flex items-start gap-1 text-xs text-slate-500">
              <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{offer.note}</span>
            </div>
          )}
          <div className="text-xs text-slate-400">
            创建于 {formatDate(offer.createdAt)}
            {offer.createdAt !== offer.updatedAt && ` · 更新于 ${formatDate(offer.updatedAt)}`}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => openHistoryModal(offer)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="议价历史"
          >
            <History className="w-4 h-4" />
          </button>
          {['pending', 'negotiating'].includes(offer.status) && (
            <>
              <button
                onClick={() => handleAcceptOffer(offer)}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="接受出价"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => openCounterModal(offer)}
                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="还价"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => openRejectModal(offer)}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="拒绝"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          {offer.status === 'accepted' && !offer.saleId && (
            <button
              onClick={() => openCreateSaleModal(offer)}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              title="生成成交单"
            >
              <ShoppingCart className="w-4 h-4" />
              生成成交单
            </button>
          )}
          {offer.saleId && (
            <span className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              已关联成交单 #{offer.saleId}
            </span>
          )}
          <button
            onClick={() => handleDeleteOffer(offer.id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="删除出价"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {offer.histories && offer.histories.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <History className="w-3 h-3" />
            最近议价记录
          </div>
          <div className="space-y-1">
            {offer.histories.slice(-3).reverse().map((history) => (
              <div key={history.id} className="text-xs text-slate-600 flex items-baseline gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  history.actor === 'seller' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                }`}>
                  {OFFER_ACTOR_LABELS[history.actor]}
                </span>
                <span>{OFFER_ACTION_LABELS[history.action]}</span>
                {history.price && (
                  <span className="font-medium text-slate-700">{formatCurrency(history.price)}</span>
                )}
                {history.comment && <span className="text-slate-500">「{history.comment}」</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

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
                  onClick={() => setModalMode('listing')}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  发起挂售
                </button>
                <button
                  onClick={() => setModalMode('sale')}
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
                onClick={() => setModalMode('cost')}
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
                onClick={() => setModalMode('usage')}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                挂售记录与出价
              </h3>
              {item.status !== 'sold' && (
                <button
                  onClick={() => setModalMode('listing')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  发起挂售
                </button>
              )}
            </div>
            {item.listings.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">暂无挂售记录</p>
            ) : (
              <div className="space-y-3">
                {item.listings.map((listing) => {
                  const listingOffers = getListingOffers(listing.id);
                  const isExpanded = expandedListingId === listing.id;
                  const activeOffers = listingOffers.filter(o => ['pending', 'negotiating'].includes(o.status));
                  const acceptedOffers = listingOffers.filter(o => o.status === 'accepted');

                  return (
                    <div key={listing.id} className="rounded-lg border border-slate-200 overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <button
                            onClick={() => toggleExpandListing(listing.id)}
                            className="flex items-center gap-3 text-left flex-1 min-w-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            )}
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                              style={{ backgroundColor: PLATFORM_COLORS[listing.platform] }}
                            >
                              {PLATFORM_LABELS[listing.platform].charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-slate-800">
                                {PLATFORM_LABELS[listing.platform]}
                              </div>
                              {listing.note && (
                                <div className="text-xs text-slate-500 line-clamp-1">{listing.note}</div>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center gap-4 flex-wrap sm:justify-end sm:flex-1">
                            <div className="text-center">
                              <div className="text-xs text-slate-400">挂售价</div>
                              <div className="text-sm font-bold text-primary-600">{formatCurrency(listing.price)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-slate-400">日期</div>
                              <div className="text-sm text-slate-600">{formatDate(listing.listDate)}</div>
                            </div>
                            <div className="text-center">
                              <span className={`status-badge ${
                                listing.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                listing.status === 'sold' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {LISTING_STATUS_LABELS[listing.status]}
                              </span>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-slate-400 flex items-center gap-1 justify-center">
                                <MessageSquare className="w-3 h-3" />
                                出价
                              </div>
                              <div className="flex items-center gap-1 justify-center">
                                <span className="text-sm font-bold text-slate-700">{listingOffers.length}</span>
                                {activeOffers.length > 0 && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                    {activeOffers.length}待处理
                                  </span>
                                )}
                                {acceptedOffers.length > 0 && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                    {acceptedOffers.length}已接受
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {listing.status !== 'sold' && (
                              <>
                                <button
                                  onClick={() => openOfferModal(listing)}
                                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                  title="添加出价"
                                >
                                  <Tag className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="删除挂售"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-white px-4 pb-4 pt-2">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              出价记录 ({listingOffers.length})
                            </h4>
                            {listing.status !== 'sold' && (
                              <button
                                onClick={() => openOfferModal(listing)}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                添加出价
                              </button>
                            )}
                          </div>
                          {listingOffers.length === 0 ? (
                            <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-sm text-slate-500">暂无出价记录</p>
                              {listing.status !== 'sold' && (
                                <button
                                  onClick={() => openOfferModal(listing)}
                                  className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                                >
                                  立即添加第一条出价
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {listingOffers.map(renderOfferCard)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={modalMode === 'listing'} onClose={closeModal} title="发起挂售">
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
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1">
              确认挂售
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalMode === 'sale'} onClose={closeModal} title="录入成交">
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
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1">
              确认成交
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalMode === 'usage'} onClose={closeModal} title="添加使用记录">
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
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1">
              添加记录
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalMode === 'cost'} onClose={closeModal} title="添加附加成本">
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
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1" style={{ backgroundColor: '#E11D48' }}>
              确认添加
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalMode === 'offer'}
        onClose={closeModal}
        title={`添加出价 - ${item?.name}`}
      >
        <form onSubmit={handleSubmitOffer} className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>挂售平台：</span>
              <span className="font-medium">
                {selectedListingForOffer && PLATFORM_LABELS[selectedListingForOffer.platform]}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 mt-1">
              <span>挂售价格：</span>
              <span className="font-bold text-primary-600">
                {selectedListingForOffer && formatCurrency(selectedListingForOffer.price)}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              买家姓名 *
            </label>
            <input
              type="text"
              value={offerForm.buyerName}
              onChange={(e) => setOfferForm({ ...offerForm, buyerName: e.target.value })}
              className="input-field"
              placeholder="请输入买家姓名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              联系方式
            </label>
            <input
              type="text"
              value={offerForm.buyerContact}
              onChange={(e) => setOfferForm({ ...offerForm, buyerContact: e.target.value })}
              className="input-field"
              placeholder="手机号、微信号等"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <Tag className="w-4 h-4 inline mr-1" />
              出价金额 *
            </label>
            <input
              type="number"
              value={offerForm.offerPrice}
              onChange={(e) => setOfferForm({ ...offerForm, offerPrice: e.target.value })}
              className="input-field"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">运费</label>
            <input
              type="number"
              value={offerForm.shippingFee}
              onChange={(e) => setOfferForm({ ...offerForm, shippingFee: e.target.value })}
              className="input-field"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              备注
            </label>
            <textarea
              value={offerForm.note}
              onChange={(e) => setOfferForm({ ...offerForm, note: e.target.value })}
              className="input-field min-h-[60px]"
              placeholder="出价相关备注..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1">
              添加出价
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalMode === 'counter'}
        onClose={closeModal}
        title={`还价 - ${selectedOffer?.buyerName}`}
      >
        <form onSubmit={handleSubmitCounter} className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>挂售价：</span>
              <span className="font-medium">{selectedOffer && formatCurrency(selectedOffer.listingPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>买家当前出价：</span>
              <span className="font-bold text-primary-600">
                {selectedOffer && formatCurrency(selectedOffer.currentPrice)}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <Tag className="w-4 h-4 inline mr-1" />
              还价金额 *
            </label>
            <input
              type="number"
              value={counterForm.counterPrice}
              onChange={(e) => setCounterForm({ ...counterForm, counterPrice: e.target.value })}
              className="input-field"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              备注
            </label>
            <textarea
              value={counterForm.comment}
              onChange={(e) => setCounterForm({ ...counterForm, comment: e.target.value })}
              className="input-field min-h-[60px]"
              placeholder="还价说明..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1">
              确认还价
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalMode === 'reject'}
        onClose={closeModal}
        title={`拒绝出价 - ${selectedOffer?.buyerName}`}
      >
        <form onSubmit={handleSubmitReject} className="space-y-4">
          <div className="bg-rose-50 rounded-lg p-3 text-sm">
            <div className="text-rose-700 font-medium">
              即将拒绝 {selectedOffer?.buyerName} 的出价 {selectedOffer && formatCurrency(selectedOffer.currentPrice)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              拒绝原因（可选）
            </label>
            <textarea
              value={rejectForm.comment}
              onChange={(e) => setRejectForm({ ...rejectForm, comment: e.target.value })}
              className="input-field min-h-[80px]"
              placeholder="为什么拒绝这个出价..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors">
              确认拒绝
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalMode === 'history'}
        onClose={closeModal}
        title={`议价历史 - ${selectedOffer?.buyerName}`}
      >
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>初始出价：</span>
              <span className="font-medium">{selectedOffer && formatCurrency(selectedOffer.offerPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>当前价格：</span>
              <span className="font-bold text-primary-600">
                {selectedOffer && formatCurrency(selectedOffer.currentPrice)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>当前状态：</span>
              {selectedOffer && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${OFFER_STATUS_COLORS[selectedOffer.status]}`}>
                  {OFFER_STATUS_LABELS[selectedOffer.status]}
                </span>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              完整记录
            </h4>
            {selectedOffer?.histories && selectedOffer.histories.length > 0 ? (
              <div className="relative">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200" />
                <div className="space-y-4">
                  {selectedOffer.histories.map((history) => (
                    <div key={history.id} className="relative pl-8">
                      <div className={`absolute left-1.5 w-3 h-3 rounded-full border-2 border-white ${
                        history.actor === 'seller' ? 'bg-blue-500' : 'bg-purple-500'
                      }`} />
                      <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            history.actor === 'seller' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {OFFER_ACTOR_LABELS[history.actor]}
                          </span>
                          <span className="font-medium text-slate-800 text-sm">
                            {OFFER_ACTION_LABELS[history.action]}
                          </span>
                          {history.price && (
                            <span className="text-sm font-bold text-primary-600">
                              {formatCurrency(history.price)}
                            </span>
                          )}
                        </div>
                        {history.comment && (
                          <p className="text-sm text-slate-600 mb-1">「{history.comment}」</p>
                        )}
                        <p className="text-xs text-slate-400">{formatDate(history.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                暂无议价记录
              </div>
            )}
          </div>
          <div className="pt-2">
            <button onClick={closeModal} className="btn-primary w-full">
              关闭
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalMode === 'createSale'}
        onClose={closeModal}
        title={`生成成交单 - ${selectedOffer?.buyerName}`}
      >
        <form onSubmit={handleSubmitCreateSale} className="space-y-4">
          <div className="bg-emerald-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between text-slate-700">
              <span>物品：</span>
              <span className="font-medium">{item?.name}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>成交价：</span>
              <span className="font-bold text-emerald-700">
                {selectedOffer && formatCurrency(selectedOffer.currentPrice)}
              </span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>买家：</span>
              <span className="font-medium">{selectedOffer?.buyerName}</span>
            </div>
            {selectedOffer?.buyerContact && (
              <div className="flex justify-between text-slate-700">
                <span>联系方式：</span>
                <span className="font-medium">{selectedOffer.buyerContact}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">成交日期 *</label>
            <input
              type="date"
              value={createSaleForm.saleDate}
              onChange={(e) => setCreateSaleForm({ ...createSaleForm, saleDate: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">运费</label>
            <input
              type="number"
              value={createSaleForm.shippingFee}
              onChange={(e) => setCreateSaleForm({ ...createSaleForm, shippingFee: e.target.value })}
              className="input-field"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              备注
            </label>
            <textarea
              value={createSaleForm.note}
              onChange={(e) => setCreateSaleForm({ ...createSaleForm, note: e.target.value })}
              className="input-field min-h-[60px]"
              placeholder="成交备注..."
            />
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
            生成成交单后，物品状态将变为「已成交」，挂售记录状态将变为「已售出」，同挂售的其他待处理出价将自动关闭。
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              确认生成成交单
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
