import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, Package, Wallet, Percent } from 'lucide-react';
import type { ItemWithStats } from '../../../shared/types';
import { STATUS_LABELS, STATUS_COLORS } from '../../../shared/types';
import { formatCurrency, formatDays, getProgressColor, getProfitColor, formatProfit } from '../../utils/format';

interface ItemCardProps {
  item: ItemWithStats;
  index: number;
}

export default function ItemCard({ item, index }: ItemCardProps) {
  const navigate = useNavigate();
  const animationDelay = `${index * 0.08}s`;

  const imageUrl = item.image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(item.name + ' ' + item.category)}&image_size=square`;

  return (
    <div
      className="item-card cursor-pointer animate-fade-in-up opacity-0"
      style={{ animationDelay }}
      onClick={() => navigate(`/items/${item.id}`)}
    >
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(item.name)}`;
          }}
        />
        <div className="absolute top-3 left-3">
          <span className={`status-badge ${STATUS_COLORS[item.status]}`}>
            {STATUS_LABELS[item.status]}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-slate-600">
            {item.category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-800 mb-2 line-clamp-1">{item.name}</h3>
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center gap-1 text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>{formatDays(item.holdingDays)}</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-primary-600">
              {formatCurrency(item.totalCost)}
            </div>
            {item.totalCosts > 0 && (
              <div className="text-xs text-rose-500">
                含附加 {formatCurrency(item.totalCosts)}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              回本进度
            </span>
            <span className="font-bold text-slate-700">{item.returnProgress}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(item.returnProgress)}`}
              style={{
                width: `${item.returnProgress}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>当前估值</span>
            <span className="font-medium">{formatCurrency(item.currentValue)}</span>
          </div>
        </div>
        {item.sale && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Package className="w-3 h-3" />
                成交价
              </span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(item.sale.salePrice)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                净利润
              </span>
              <span className={`font-bold ${getProfitColor(item.netProfit ?? 0)}`}>
                {formatProfit(item.netProfit ?? 0)}
              </span>
            </div>
            {item.grossMargin !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  毛利率
                </span>
                <span className={`font-bold ${getProfitColor(item.grossMargin)}`}>
                  {item.grossMargin > 0 ? '+' : ''}{item.grossMargin}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
