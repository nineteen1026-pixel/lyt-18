import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { api } from '../../utils/api';
import { PLATFORM_LABELS, PLATFORM_COLORS, LISTING_STATUS_LABELS } from '../../../shared/types';
import { formatCurrency, formatDate } from '../../utils/format';
import Modal from '../../components/Modal/Modal';

export default function Listings() {
  const { listings, loading, fetchListings, items, fetchItems } = useStore();
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<any>(null);
  const [formData, setFormData] = useState({
    itemId: '',
    platform: 'xianyu',
    price: '',
    listDate: new Date().toISOString().split('T')[0],
    status: 'active',
    note: '',
  });

  useEffect(() => {
    fetchListings({
      platform: platformFilter !== 'all' ? platformFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    });
    fetchItems();
  }, [fetchListings, fetchItems, platformFilter, statusFilter]);

  const filteredListings = listings.filter((listing) => {
    const searchMatch = searchQuery === '' ||
      listing.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.note?.toLowerCase().includes(searchQuery.toLowerCase());
    return searchMatch;
  });

  const availableItems = items.filter(i => i.status !== 'sold');

  const handleOpenModal = (listing?: any) => {
    if (listing) {
      setEditingListing(listing);
      setFormData({
        itemId: String(listing.itemId),
        platform: listing.platform,
        price: String(listing.price),
        listDate: listing.listDate,
        status: listing.status,
        note: listing.note || '',
      });
    } else {
      setEditingListing(null);
      setFormData({
        itemId: availableItems[0]?.id ? String(availableItems[0].id) : '',
        platform: 'xianyu',
        price: '',
        listDate: new Date().toISOString().split('T')[0],
        status: 'active',
        note: '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        itemId: Number(formData.itemId),
        price: Number(formData.price),
      };
      if (editingListing) {
        await api.listings.update(editingListing.id, data);
      } else {
        await api.listings.create(data);
      }
      setModalOpen(false);
      fetchListings();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这条挂售记录吗？')) {
      try {
        await api.listings.delete(id);
        fetchListings();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  if (loading.listings || loading.items) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">挂售管理</h1>
          <p className="text-slate-500 text-sm">管理多平台挂售记录</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">物品</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">平台</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">挂售价格</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">挂售日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: PLATFORM_COLORS[listing.platform] }}
                      >
                        {listing.itemName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{listing.itemName}</div>
                        {listing.note && (
                          <div className="text-xs text-slate-500 line-clamp-1">{listing.note}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="platform-tag text-white"
                      style={{ backgroundColor: PLATFORM_COLORS[listing.platform] }}
                    >
                      {PLATFORM_LABELS[listing.platform]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600">
                    {formatCurrency(listing.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {formatDate(listing.listDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-badge ${
                      listing.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      listing.status === 'sold' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {LISTING_STATUS_LABELS[listing.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {listing.status !== 'sold' && (
                        <>
                          <button
                            onClick={() => handleOpenModal(listing)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(listing.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredListings.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-500">暂无挂售记录</p>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingListing ? '编辑挂售' : '新增挂售'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingListing && (
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
                  <option key={item.id} value={item.id}>{item.name} ({formatCurrency(item.buyPrice)})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">挂售平台</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">挂售价格</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
              value={formData.listDate}
              onChange={(e) => setFormData({ ...formData, listDate: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="input-field min-h-[60px]"
              placeholder="是否包邮、议价说明等..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1">
              {editingListing ? '保存修改' : '新增挂售'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
