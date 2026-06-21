import { useEffect, useState } from 'react';
import { Package, ShoppingBag, Tag, TrendingUp, Clock, DollarSign, Search, Wallet, Percent } from 'lucide-react';
import { useStore } from '../../store/useStore';
import ItemCard from '../../components/ItemCard/ItemCard';
import StatCard from '../../components/StatCard/StatCard';
import { CATEGORIES } from '../../../shared/types';
import { formatProfit, getProfitColor } from '../../utils/format';

export default function Dashboard() {
  const { items, stats, loading, fetchAll } = useStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredItems = items.filter((item) => {
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    const searchMatch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && categoryMatch && searchMatch;
  });

  const holdingItems = items.filter(i => i.status === 'holding');
  const listingItems = items.filter(i => i.status === 'listing');
  const soldItems = items.filter(i => i.status === 'sold');

  if (loading.items || loading.stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up opacity-0">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">物品概览</h1>
        <p className="text-slate-500">追踪每件二手物品的全生命周期</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总物品数"
          value={stats.summary?.totalItems || 0}
          icon={Package}
          color="text-primary-600"
        />
        <StatCard
          title="持有中"
          value={stats.summary?.holdingItems || 0}
          icon={ShoppingBag}
          color="text-amber-600"
        />
        <StatCard
          title="挂售中"
          value={stats.summary?.listingItems || 0}
          icon={Tag}
          color="text-blue-600"
        />
        <StatCard
          title="已成交"
          value={stats.summary?.soldItems || 0}
          icon={TrendingUp}
          color="text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总买入成本"
          value={stats.summary?.totalExpense || 0}
          icon={DollarSign}
          isCurrency
          color="text-primary-600"
          subtitle="所有物品买入价合计"
        />
        <StatCard
          title="总附加成本"
          value={stats.summary?.totalCosts || 0}
          icon={Wallet}
          isCurrency
          color="text-rose-600"
          subtitle="运费/维修/配件等"
        />
        <StatCard
          title="净利润（已售）"
          value={stats.summary?.netProfit || 0}
          icon={TrendingUp}
          isCurrency
          color={stats.summary && stats.summary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}
          subtitle="扣除综合成本后的真实收益"
        />
        <StatCard
          title="平均毛利率"
          value={`${stats.summary?.avgGrossMargin || 0}%`}
          icon={Percent}
          color={getProfitColor(stats.summary?.avgGrossMargin || 0)}
          subtitle="基于已成交物品"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="整体回本率"
          value={`${stats.summary?.returnRate || 0}%`}
          icon={TrendingUp}
          color={stats.summary && stats.summary.returnRate >= 100 ? 'text-emerald-600' : 'text-primary-600'}
          subtitle="基于综合成本计算"
        />
        <StatCard
          title="平均回本周期"
          value={`${stats.summary?.avgHoldingDays || 0} 天`}
          icon={Clock}
          color="text-slate-700"
        />
        <StatCard
          title="已成交物品"
          value={stats.summary?.soldItems || 0}
          icon={Package}
          color="text-emerald-600"
        />
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索物品名称..."
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
            <option value="holding">持有中</option>
            <option value="listing">挂售中</option>
            <option value="sold">已成交</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field w-full sm:w-auto"
          >
            <option value="all">全部分类</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">全部物品</h2>
          <div className="flex gap-2">
            <span className="text-sm text-slate-500">
              共 {filteredItems.length} 件物品
            </span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-100">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">暂无符合条件的物品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item, index) => (
              <ItemCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
