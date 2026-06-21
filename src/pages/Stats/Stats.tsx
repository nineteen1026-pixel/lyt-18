import { useEffect } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DollarSign, TrendingUp, Clock, Package, ShoppingBag, Tag, Percent, Wallet } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PLATFORM_LABELS, PLATFORM_COLORS } from '../../../shared/types';
import { formatCurrency, formatProfit, getProfitColor } from '../../utils/format';
import StatCard from '../../components/StatCard/StatCard';

export default function Stats() {
  const { stats, loading, fetchStats } = useStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading.stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const pieData = stats.platform.map((p) => ({
    name: PLATFORM_LABELS[p.platform],
    value: p.amount,
    color: PLATFORM_COLORS[p.platform],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">统计分析</h1>
        <p className="text-slate-500 text-sm">查看交易数据和收益分析，净利润已扣除附加成本</p>
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
          title="总收入"
          value={stats.summary?.totalIncome || 0}
          icon={DollarSign}
          isCurrency
          color="text-emerald-600"
          subtitle="已售出物品成交净额"
        />
        <StatCard
          title="净利润"
          value={stats.summary?.netProfit || 0}
          icon={TrendingUp}
          isCurrency
          color={stats.summary && stats.summary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}
          subtitle="扣除综合成本后的真实收益"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="整体回本率"
          value={`${stats.summary?.returnRate || 0}%`}
          icon={Percent}
          color={stats.summary && stats.summary.returnRate >= 100 ? 'text-emerald-600' : 'text-primary-600'}
          subtitle="基于综合成本计算"
        />
        <StatCard
          title="平均毛利率"
          value={`${stats.summary?.avgGrossMargin || 0}%`}
          icon={Percent}
          color={getProfitColor(stats.summary?.avgGrossMargin || 0)}
          subtitle="已售物品的平均毛利率"
        />
        <StatCard
          title="平均回本周期"
          value={`${stats.summary?.avgHoldingDays || 0} 天`}
          icon={Clock}
          color="text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">月度收支趋势（含附加成本）</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="收入"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="支出(含附加成本)"
                  stroke="#EC4899"
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">平台成交占比</h3>
          <div className="h-72">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                暂无成交数据
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">月度净利润（扣除附加成本）</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value: number) => [formatProfit(value), '净利润']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
                <Bar
                  dataKey="profit"
                  name="净利润"
                  radius={[4, 4, 0, 0]}
                  fill="#0F766E"
                >
                  {stats.monthly.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.profit >= 0 ? '#10B981' : '#EC4899'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">分类收益对比（扣除附加成本）</h3>
          <div className="h-72">
            {stats.category.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.category}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 80, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatProfit(value), '净利润']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                  />
                  <Bar
                    dataKey="profit"
                    name="净利润"
                    radius={[0, 4, 4, 0]}
                  >
                    {stats.category.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.profit >= 0 ? '#0F766E' : '#EC4899'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                暂无分类数据
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">平台成交明细</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">平台</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">成交笔数</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">成交净额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.platform.map((p) => (
                <tr key={p.platform} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: PLATFORM_COLORS[p.platform] }}
                      >
                        {PLATFORM_LABELS[p.platform].charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{PLATFORM_LABELS[p.platform]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">{p.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="font-bold text-primary-600">{formatCurrency(p.amount)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {stats.platform.length === 0 && (
          <div className="py-8 text-center text-slate-500">暂无平台数据</div>
        )}
      </div>
    </div>
  );
}
