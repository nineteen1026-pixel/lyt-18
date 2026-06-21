import { Request, Response } from 'express';
import db from '../db/index.js';
import type { StatsSummary, MonthlyData, PlatformData, CategoryData } from '../../../shared/types.js';

export const getSummary = (req: Request, res: Response) => {
  const totalItems = (db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number }).count;
  const holdingItems = (db.prepare("SELECT COUNT(*) as count FROM items WHERE status = 'holding'").get() as { count: number }).count;
  const listingItems = (db.prepare("SELECT COUNT(*) as count FROM items WHERE status = 'listing'").get() as { count: number }).count;
  const soldItems = (db.prepare("SELECT COUNT(*) as count FROM items WHERE status = 'sold'").get() as { count: number }).count;

  const totalIncome = (db.prepare('SELECT COALESCE(SUM(sale_price - shipping_fee), 0) as total FROM sales').get() as { total: number }).total;
  const totalExpense = (db.prepare('SELECT COALESCE(SUM(buy_price), 0) as total FROM items').get() as { total: number }).total;
  const soldExpense = (db.prepare("SELECT COALESCE(SUM(buy_price), 0) as total FROM items WHERE status = 'sold'").get() as { total: number }).total;

  const netProfit = totalIncome - soldExpense;
  const returnRate = soldExpense > 0 ? Math.round((totalIncome / soldExpense) * 100) : 0;

  const soldItemsWithDates = db.prepare(`
    SELECT i.buy_date, s.sale_date
    FROM items i
    JOIN sales s ON i.id = s.item_id
    WHERE i.status = 'sold'
  `).all() as { buy_date: string; sale_date: string }[];

  let avgHoldingDays = 0;
  if (soldItemsWithDates.length > 0) {
    const totalDays = soldItemsWithDates.reduce((sum, item) => {
      const start = new Date(item.buy_date);
      const end = new Date(item.sale_date);
      return sum + Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    avgHoldingDays = Math.round(totalDays / soldItemsWithDates.length);
  }

  const summary: StatsSummary = {
    totalItems,
    holdingItems,
    listingItems,
    soldItems,
    totalIncome,
    totalExpense,
    netProfit,
    returnRate,
    avgHoldingDays,
  };

  res.json({
    code: 0,
    message: 'success',
    data: summary,
  });
};

export const getMonthlyData = (req: Request, res: Response) => {
  const months = db.prepare(`
    SELECT 
      strftime('%Y-%m', sale_date) as month,
      SUM(sale_price - shipping_fee) as income
    FROM sales
    GROUP BY strftime('%Y-%m', sale_date)
    ORDER BY month
  `).all() as { month: string; income: number }[];

  const expenseMonths = db.prepare(`
    SELECT 
      strftime('%Y-%m', buy_date) as month,
      SUM(buy_price) as expense
    FROM items
    GROUP BY strftime('%Y-%m', buy_date)
    ORDER BY month
  `).all() as { month: string; expense: number }[];

  const monthMap = new Map<string, { income: number; expense: number }>();

  months.forEach((m) => {
    monthMap.set(m.month, { income: m.income, expense: 0 });
  });

  expenseMonths.forEach((m) => {
    const existing = monthMap.get(m.month) || { income: 0, expense: 0 };
    monthMap.set(m.month, { ...existing, expense: m.expense });
  });

  const sortedMonths = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      profit: data.income - data.expense,
    })) as MonthlyData[];

  res.json({
    code: 0,
    message: 'success',
    data: sortedMonths,
  });
};

export const getPlatformData = (req: Request, res: Response) => {
  const data = db.prepare(`
    SELECT 
      platform,
      COUNT(*) as count,
      SUM(sale_price - shipping_fee) as amount
    FROM sales
    GROUP BY platform
    ORDER BY amount DESC
  `).all() as PlatformData[];

  res.json({
    code: 0,
    message: 'success',
    data,
  });
};

export const getCategoryData = (req: Request, res: Response) => {
  const data = db.prepare(`
    SELECT 
      i.category,
      COUNT(*) as count,
      SUM(s.sale_price - COALESCE(s.shipping_fee, 0) - i.buy_price) as profit
    FROM items i
    JOIN sales s ON i.id = s.item_id
    WHERE i.status = 'sold'
    GROUP BY i.category
    ORDER BY profit DESC
  `).all() as CategoryData[];

  res.json({
    code: 0,
    message: 'success',
    data,
  });
};
