export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDays(days: number): string {
  if (days < 30) {
    return `${days} 天`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    return remainingDays > 0 ? `${months} 个月 ${remainingDays} 天` : `${months} 个月`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  return remainingMonths > 0 ? `${years} 年 ${remainingMonths} 个月` : `${years} 年`;
}

export function getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
  if (progress >= 50) return 'bg-gradient-to-r from-primary-400 to-primary-500';
  if (progress >= 20) return 'bg-gradient-to-r from-amber-400 to-amber-500';
  return 'bg-gradient-to-r from-rose-400 to-rose-500';
}

export function getProfitColor(profit: number): string {
  if (profit > 0) return 'text-emerald-600';
  if (profit < 0) return 'text-rose-600';
  return 'text-slate-600';
}

export function formatProfit(profit: number): string {
  const prefix = profit > 0 ? '+' : '';
  return `${prefix}${formatCurrency(profit)}`;
}

export function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function generateItemImage(name: string, category: string): string {
  const categoryEmojis: Record<string, string> = {
    '数码产品': '📱',
    '家用电器': '🔌',
    '家居家具': '🛋️',
    '游戏设备': '🎮',
    '运动户外': '🏃',
    '图书文具': '📚',
    '服饰箱包': '👕',
    '母婴用品': '👶',
    '其他': '📦',
  };
  const emoji = categoryEmojis[category] || '📦';
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 400, 300);
    gradient.addColorStop(0, '#F1F5F9');
    gradient.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 300);
    ctx.font = '120px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 200, 140);
    ctx.font = 'bold 24px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(name, 200, 250);
    return canvas.toDataURL();
  }
  return '';
}
