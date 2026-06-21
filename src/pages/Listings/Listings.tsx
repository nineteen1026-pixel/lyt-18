import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Search, MessageSquare, Check, X, RefreshCw, ShoppingCart, ChevronDown, ChevronUp, User, Phone, FileText, History, Tag } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { api } from '../../utils/api';
import { PLATFORM_LABELS, PLATFORM_COLORS, LISTING_STATUS_LABELS, OFFER_STATUS_LABELS, OFFER_STATUS_COLORS, OFFER_ACTION_LABELS, OFFER_ACTOR_LABELS } from '../../../shared/types';
import type { ListingWithItem, OfferWithDetails } from '../../../shared/types';
import { formatCurrency, formatDate } from '../../utils/format';
import Modal from '../../components/Modal/Modal';

type ModalMode = 'none' | 'listing' | 'offer' | 'counter' | 'reject' | 'history' | 'createSale';

export default function Listings() {
  const { listings, loading, fetchListings, items, fetchItems, offers, fetchOffers, fetchSales } = useStore();
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedListingId, setExpandedListingId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [editingListing, setEditingListing] = useState<ListingWithItem | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithDetails | null>(null);
  const [selectedListingForOffer, setSelectedListingForOffer] = useState<ListingWithItem | null>(null);
  const [listingForm, setListingForm] = useState({
    itemId: '',
    platform: 'xianyu',
    price: '',
    listDate: new Date().toISOString().split('T')[0],
    status: 'active',
    note: '',
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
    fetchListings({
      platform: platformFilter !== 'all' ? platformFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    });
    fetchItems();
    fetchOffers();
  }, [fetchListings, fetchItems, fetchOffers, platformFilter, statusFilter]);

  const filteredListings = listings.filter((listing) => {
    const searchMatch = searchQuery === '' ||
      listing.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.note?.toLowerCase().includes(searchQuery.toLowerCase());
    return searchMatch;
  });

  const availableItems = items.filter(i => i.status !== 'sold');

  const getListingOffers = (listingId: number) => {
    return offers.filter(o => o.listingId === listingId);
  };

  const toggleExpandListing = (listingId: number) => {
    setExpandedListingId(expandedListingId === listingId ? null : listingId);
    if (expandedListingId !== listingId) {
      fetchOffers({ listingId });
    }
  };

  const openListingModal = (listing?: ListingWithItem) => {
    if (listing) {
      setEditingListing(listing);
      setListingForm({
        itemId: String(listing.itemId),
        platform: listing.platform,
        price: String(listing.price),
        listDate: listing.listDate,
        status: listing.status,
        note: listing.note || '',
      });
    } else {
      setEditingListing(null);
      setListingForm({
        itemId: availableItems[0]?.id ? String(availableItems[0].id) : '',
        platform: 'xianyu',
        price: '',
        listDate: new Date().toISOString().split('T')[0],
        status: 'active',
        note: '',
      });
    }
    setModalMode('listing');
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

  const closeModal = () => {
    setModalMode('none');
    setEditingListing(null);
    setSelectedOffer(null);
    setSelectedListingForOffer(null);
  };

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...listingForm,
        itemId: Number(listingForm.itemId),
        price: Number(listingForm.price),
      };
      if (editingListing) {
        await api.listings.update(editingListing.id, data);
      } else {
        await api.listings.create(data);
      }
      closeModal();
      fetchListings();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (confirm('确定要删除这条挂售记录吗？相关出价也会被删除。')) {
      try {
        await api.listings.delete(id);
        fetchListings();
        fetchOffers();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingForOffer) return;
    try {
      const data = {
        listingId: selectedListingForOffer.id,
        buyerName: offerForm.buyerName,
        buyerContact: offerForm.buyerContact || undefined,
        offerPrice: Number(offerForm.offerPrice),
        shippingFee: offerForm.shippingFee ? Number(offerForm.shippingFee) : 0,
        note: offerForm.note || undefined,
      };
      await api.offers.create(data);
      closeModal();
      fetchOffers();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAcceptOffer = async (offer: OfferWithDetails) => {
    if (confirm(`确定接受买家 ${offer.buyerName} 的出价 ${formatCurrency(offer.currentPrice)} 吗？`)) {
      try {
        await api.offers.accept(offer.id);
        fetchOffers();
        fetchSales();
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
      fetchOffers();
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
      fetchOffers();
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
      fetchListings();
      fetchOffers();
      fetchSales();
      fetchItems();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDeleteOffer = async (offerId: number) => {
    if (confirm('确定要删除这条出价记录吗？')) {
      try {
        await api.offers.delete(offerId);
        fetchOffers();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  if (loading.listings || loading.items || loading.offers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const getPriceDiffColor = (offer: OfferWithDetails) => {
    const diff = offer.currentPrice - offer.listingPrice;
    if (diff >= 0) return 'text-emerald-600';
    if (diff >= -offer.listingPrice * 0.1) return 'text-amber-600';
    return 'text-rose-600';
  };

  const renderOfferCard = (offer: OfferWithDetails) => (
    <div
      key={offer.id}
      className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-primary-200 transition-all"
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
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
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
        <div className="mt-3 pt-3 border-t border-slate-200">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">挂售管理</h1>
          <p className="text-slate-500 text-sm">管理多平台挂售记录与买家出价</p>
        </div>
        <button onClick={() => openListingModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          新增挂售
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索物品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full sm:w-auto"
          >
            <option value="all">全部状态</option>
            {Object.entries(LISTING_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredListings.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500">暂无挂售记录</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredListings.map((listing) => {
              const listingOffers = getListingOffers(listing.id);
              const isExpanded = expandedListingId === listing.id;
              const activeOffers = listingOffers.filter(o => ['pending', 'negotiating'].includes(o.status));
              const acceptedOffers = listingOffers.filter(o => o.status === 'accepted');

              return (
                <div key={listing.id}>
                  <div className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <button
                        onClick={() => toggleExpandListing(listing.id)}
                        className="flex items-center gap-3 text-left flex-1 min-w-0"
                      >
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                            style={{ backgroundColor: PLATFORM_COLORS[listing.platform] }}
                          >
                            {listing.itemName?.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-slate-800 truncate">{listing.itemName}</div>
                            {listing.note && (
                              <div className="text-xs text-slate-500 line-clamp-1">{listing.note}</div>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-4 flex-wrap sm:justify-end sm:flex-1">
                        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                          <div className="text-center">
                            <div className="text-xs text-slate-400">平台</div>
                            <span
                              className="platform-tag text-white text-xs"
                              style={{ backgroundColor: PLATFORM_COLORS[listing.platform] }}
                            >
                              {PLATFORM_LABELS[listing.platform]}
                            </span>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-400">挂售价</div>
                            <div className="text-sm font-bold text-primary-600">{formatCurrency(listing.price)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-400">日期</div>
                            <div className="text-sm text-slate-600">{formatDate(listing.listDate)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-400">状态</div>
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
                                onClick={() => openListingModal(listing)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="编辑"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteListing(listing.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50/50 px-6 pb-6 pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          出价记录 ({listingOffers.length})
                        </h3>
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
                        <div className="py-8 text-center bg-white rounded-lg border border-dashed border-slate-200">
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

      <Modal
        isOpen={modalMode === 'listing'}
        onClose={closeModal}
        title={editingListing ? '编辑挂售' : '新增挂售'}
      >
        <form onSubmit={handleSubmitListing} className="space-y-4">
          {!editingListing && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">选择物品</label>
              <select
                value={listingForm.itemId}
                onChange={(e) => setListingForm({ ...listingForm, itemId: e.target.value })}
                className="input-field"
                required
              >
                <option value="">请选择物品</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({formatCurrency(item.buyPrice)})
                  </option>
                ))}
              </select>
            </div>
          )}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
            <select
              value={listingForm.status}
              onChange={(e) => setListingForm({ ...listingForm, status: e.target.value })}
              className="input-field"
            >
              {Object.entries(LISTING_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
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
              {editingListing ? '保存修改' : '新增挂售'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalMode === 'offer'}
        onClose={closeModal}
        title={`添加出价 - ${selectedListingForOffer?.itemName}`}
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
              <span className="font-medium">{selectedOffer?.itemName}</span>
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
            生成成交单后，物品状态将变为「已成交」，挂售记录状态将变为「已售出」。
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
