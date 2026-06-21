import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  isCurrency?: boolean;
  color: string;
  subtitle?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, isCurrency, color, subtitle }: StatCardProps) {
  const displayValue = isCurrency ? formatCurrency(value as number) : value;
  const trendColor = trend && trend > 0 ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color} animate-count-up opacity-0`}>
            {displayValue}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendColor}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-medium">{trend >= 0 ? '+' : ''}{trend}%</span>
              <span className="text-slate-400 text-xs">较上月</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color.replace('text-', 'from-').replace('600', '100')} to-white`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}
