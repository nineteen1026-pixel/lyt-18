import { Request, Response } from 'express';
import db from '../db/index.js';
import type { Item, UsageRecord, ItemWithStats, Sale, ItemCost, CostType } from '../../../shared/types.js';

const COST_TYPES: CostType[] = ['shipping', 'repair', 'accessory', 'cleaning', 'other'];

function calculateHoldingDays(buyDate: string, saleDate?: string): number {
  const start = new Date(buyDate);
  const end = saleDate ? new Date(saleDate) : new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getItemCosts(itemId: number): { costs: ItemCost[]; totalCosts: number; costsBreakdown: Record<CostType, number> } {
  const costRows = db.prepare(`
    SELECT id, item_id AS itemId, type, amount, note, date, created_at AS createdAt
    FROM item_costs WHERE item_id = ? ORDER BY date DESC, created_at DESC
  `).all(itemId) as ItemCost[];

  const costsBreakdown: Record<CostType, number> = {
    shipping: 0,
    repair: 0,
    accessory: 0,
    cleaning: 0,
    other: 0,
  };

  let totalCosts = 0;
  costRows.forEach((c) => {
    totalCosts += Number(c.amount);
    if (COST_TYPES.includes(c.type)) {
      costsBreakdown[c.type] += Number(c.amount);
    } else {
      costsBreakdown.other += Number(c.amount);
    }
  });

  return { costs: costRows, totalCosts, costsBreakdown };
}

function calculateReturnProgress(item: Item, totalCosts: number, sale?: Sale): number {
  if (!sale) {
    return 0;
  }
  const totalCost = item.buyPrice + totalCosts;
  if (totalCost <= 0) return 0;
  const netIncome = sale.salePrice - (sale.shippingFee || 0);
  return Math.min(100, Math.round((netIncome / totalCost) * 100));
}

function getItemWithStats(item: Item, includeCosts = false): ItemWithStats {
  const saleRaw = db.prepare(`
    SELECT id, item_id AS itemId, listing_id AS listingId, platform, sale_price AS salePrice, sale_date AS saleDate, shipping_fee AS shippingFee, buyer_info AS buyerInfo, note, created_at AS createdAt
    FROM sales WHERE item_id = ?
  `).get(item.id) as Sale | undefined;

  const sale = saleRaw || undefined;
  const holdingDays = calculateHoldingDays(item.buyDate, sale?.saleDate);
  const { costs, totalCosts, costsBreakdown } = getItemCosts(item.id);
  const totalCost = item.buyPrice + totalCosts;

  let currentValue: number;
  let netProfit: number | undefined;
  let grossMargin: number | undefined;

  if (sale) {
    const netIncome = sale.salePrice - (sale.shippingFee || 0);
    currentValue = netIncome;
    netProfit = netIncome - totalCost;
    if (sale.salePrice > 0) {
      grossMargin = Math.round((netProfit / sale.salePrice) * 100);
    }
  } else {
    const depreciationRate = 0.002;
    currentValue = Math.max(0, Math.round(totalCost * (1 - depreciationRate * holdingDays)));
  }

  const result: ItemWithStats = {
    ...item,
    holdingDays,
    currentValue,
    returnProgress: calculateReturnProgress(item, totalCosts, sale),
    totalCosts,
    costsBreakdown,
    totalCost,
    grossMargin,
    netProfit,
    sale,
  };

  if (includeCosts) {
    result.costs = costs;
  }

  return result;
}

export const getItems = (req: Request, res: Response) => {
  const { status, category, search } = req.query;

  let sql = `SELECT id, name, category, buy_price AS buyPrice, buy_date AS buyDate, image, description, status, created_at AS createdAt, updated_at AS updatedAt FROM items WHERE 1=1`;
  const params: any[] = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (category && category !== 'all') {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY created_at DESC';

  const items = db.prepare(sql).all(...params) as Item[];
  const itemsWithStats = items.map((i) => getItemWithStats(i, false));

  res.json({
    code: 0,
    message: 'success',
    data: itemsWithStats,
  });
};

export const getItemById = (req: Request, res: Response) => {
  const { id } = req.params;
  const item = db.prepare(`
    SELECT id, name, category, buy_price AS buyPrice, buy_date AS buyDate, image, description, status, created_at AS createdAt, updated_at AS updatedAt
    FROM items WHERE id = ?
  `).get(id) as Item | undefined;

  if (!item) {
    return res.status(404).json({
      code: 404,
      message: '物品不存在',
      data: null,
    });
  }

  const usageRecords = db.prepare(`
    SELECT id, item_id AS itemId, content, date, created_at AS createdAt
    FROM usage_records WHERE item_id = ? ORDER BY date DESC
  `).all(id) as UsageRecord[];

  const listings = db.prepare(`
    SELECT id, item_id AS itemId, platform, price, list_date AS listDate, status, note, created_at AS createdAt, updated_at AS updatedAt
    FROM listings WHERE item_id = ? ORDER BY created_at DESC
  `).all(id) as any[];

  const offers = db.prepare(`
    SELECT o.id, o.listing_id AS listingId, o.item_id AS itemId, o.buyer_name AS buyerName,
           o.buyer_contact AS buyerContact, o.offer_price AS offerPrice, o.current_price AS currentPrice,
           o.status, o.shipping_fee AS shippingFee, o.sale_id AS saleId, o.note,
           o.created_at AS createdAt, o.updated_at AS updatedAt,
           l.price AS listingPrice, l.platform
    FROM offers o
    LEFT JOIN listings l ON o.listing_id = l.id
    WHERE o.item_id = ?
    ORDER BY o.created_at DESC
  `).all(id) as any[];

  const offersWithHistories = offers.map((o: any) => {
    const histories = db.prepare(`
      SELECT id, offer_id AS offerId, actor, action, price, comment, created_at AS createdAt
      FROM offer_histories WHERE offer_id = ? ORDER BY created_at ASC
    `).all(o.id);
    return { ...o, histories };
  });

  const sale = db.prepare(`
    SELECT id, item_id AS itemId, listing_id AS listingId, platform, sale_price AS salePrice, sale_date AS saleDate, shipping_fee AS shippingFee, buyer_info AS buyerInfo, note, created_at AS createdAt
    FROM sales WHERE item_id = ?
  `).get(id) as Sale | undefined;

  const itemWithStats = getItemWithStats(item, true);

  res.json({
    code: 0,
    message: 'success',
    data: {
      ...itemWithStats,
      usageRecords,
      listings,
      offers: offersWithHistories,
      sale,
    },
  });
};

export const createItem = (req: Request, res: Response) => {
  const { name, category, buyPrice, buyDate, image, description } = req.body;

  if (!name || !category || !buyPrice || !buyDate) {
    return res.status(400).json({
      code: 400,
      message: '缺少必要参数',
      data: null,
    });
  }

  const stmt = db.prepare(`
    INSERT INTO items (name, category, buy_price, buy_date, image, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(name, category, buyPrice, buyDate, image || null, description || null);
  const item = db.prepare(`
    SELECT id, name, category, buy_price AS buyPrice, buy_date AS buyDate, image, description, status, created_at AS createdAt, updated_at AS updatedAt
    FROM items WHERE id = ?
  `).get(result.lastInsertRowid) as Item;

  res.json({
    code: 0,
    message: '创建成功',
    data: getItemWithStats(item, false),
  });
};

export const updateItem = (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category, buyPrice, buyDate, image, description, status } = req.body;

  const existing = db.prepare(`
    SELECT id, name, category, buy_price AS buyPrice, buy_date AS buyDate, image, description, status, created_at AS createdAt, updated_at AS updatedAt
    FROM items WHERE id = ?
  `).get(id) as Item | undefined;

  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '物品不存在',
      data: null,
    });
  }

  const stmt = db.prepare(`
    UPDATE items
    SET name = ?, category = ?, buy_price = ?, buy_date = ?, image = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    name || existing.name,
    category || existing.category,
    buyPrice || existing.buyPrice,
    buyDate || existing.buyDate,
    image !== undefined ? image : existing.image,
    description !== undefined ? description : existing.description,
    status || existing.status,
    id
  );

  const item = db.prepare(`
    SELECT id, name, category, buy_price AS buyPrice, buy_date AS buyDate, image, description, status, created_at AS createdAt, updated_at AS updatedAt
    FROM items WHERE id = ?
  `).get(id) as Item;

  res.json({
    code: 0,
    message: '更新成功',
    data: getItemWithStats(item, false),
  });
};

export const deleteItem = (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '物品不存在',
      data: null,
    });
  }

  db.prepare('DELETE FROM items WHERE id = ?').run(id);

  res.json({
    code: 0,
    message: '删除成功',
    data: null,
  });
};

export const addUsageRecord = (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, date } = req.body;

  if (!content || !date) {
    return res.status(400).json({
      code: 400,
      message: '缺少必要参数',
      data: null,
    });
  }

  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '物品不存在',
      data: null,
    });
  }

  const stmt = db.prepare(`
    INSERT INTO usage_records (item_id, content, date)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(id, content, date);
  const record = db.prepare('SELECT * FROM usage_records WHERE id = ?').get(result.lastInsertRowid);

  res.json({
    code: 0,
    message: '添加成功',
    data: record,
  });
};

export const getItemCostsList = (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '物品不存在',
      data: null,
    });
  }

  const { costs, totalCosts, costsBreakdown } = getItemCosts(Number(id));

  res.json({
    code: 0,
    message: 'success',
    data: {
      costs,
      totalCosts,
      costsBreakdown,
    },
  });
};

export const addItemCost = (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, amount, note, date } = req.body;

  if (!type || !amount || !date) {
    return res.status(400).json({
      code: 400,
      message: '缺少必要参数',
      data: null,
    });
  }

  if (!COST_TYPES.includes(type)) {
    return res.status(400).json({
      code: 400,
      message: '无效的成本类型',
      data: null,
    });
  }

  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '物品不存在',
      data: null,
    });
  }

  const stmt = db.prepare(`
    INSERT INTO item_costs (item_id, type, amount, note, date)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(id, type, Number(amount), note || null, date);
  const cost = db.prepare(`
    SELECT id, item_id AS itemId, type, amount, note, date, created_at AS createdAt
    FROM item_costs WHERE id = ?
  `).get(result.lastInsertRowid) as ItemCost;

  res.json({
    code: 0,
    message: '添加成功',
    data: cost,
  });
};

export const deleteItemCost = (req: Request, res: Response) => {
  const { id, costId } = req.params;

  const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!existingItem) {
    return res.status(404).json({
      code: 404,
      message: '物品不存在',
      data: null,
    });
  }

  const existing = db.prepare('SELECT * FROM item_costs WHERE id = ? AND item_id = ?').get(costId, id);
  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '成本记录不存在',
      data: null,
    });
  }

  db.prepare('DELETE FROM item_costs WHERE id = ? AND item_id = ?').run(costId, id);

  res.json({
    code: 0,
    message: '删除成功',
    data: null,
  });
};
