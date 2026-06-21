import { Request, Response } from 'express';
import db from '../db/index.js';
import type { Item, UsageRecord, ItemWithStats, Sale } from '../../../shared/types.js';

function calculateHoldingDays(buyDate: string, saleDate?: string): number {
  const start = new Date(buyDate);
  const end = saleDate ? new Date(saleDate) : new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateReturnProgress(item: Item, sale?: Sale): number {
  if (!sale) {
    const depreciationRate = 0.002;
    const holdingDays = calculateHoldingDays(item.buyDate);
    const currentValue = Math.max(0, item.buyPrice * (1 - depreciationRate * holdingDays));
    return Math.min(100, Math.round((currentValue / item.buyPrice) * 100));
  }
  const netIncome = sale.salePrice - (sale.shippingFee || 0);
  return Math.min(100, Math.round((netIncome / item.buyPrice) * 100));
}

function getItemWithStats(item: Item): ItemWithStats {
  const sale = db.prepare('SELECT * FROM sales WHERE item_id = ?').get(item.id) as Sale | undefined;
  const holdingDays = calculateHoldingDays(item.buyDate, sale?.saleDate);

  let currentValue: number;
  if (sale) {
    currentValue = sale.salePrice - (sale.shippingFee || 0);
  } else {
    const depreciationRate = 0.002;
    currentValue = Math.max(0, Math.round(item.buyPrice * (1 - depreciationRate * holdingDays)));
  }

  return {
    ...item,
    holdingDays,
    currentValue,
    returnProgress: calculateReturnProgress(item, sale),
    sale,
  };
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
  const itemsWithStats = items.map(getItemWithStats);

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

  const sale = db.prepare(`
    SELECT id, item_id AS itemId, listing_id AS listingId, platform, sale_price AS salePrice, sale_date AS saleDate, shipping_fee AS shippingFee, buyer_info AS buyerInfo, note, created_at AS createdAt
    FROM sales WHERE item_id = ?
  `).get(id) as Sale | undefined;

  res.json({
    code: 0,
    message: 'success',
    data: {
      ...getItemWithStats(item),
      usageRecords,
      listings,
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
    data: getItemWithStats(item),
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
    data: getItemWithStats(item),
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
