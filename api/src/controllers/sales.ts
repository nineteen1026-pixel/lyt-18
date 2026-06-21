import { Request, Response } from 'express';
import db from '../db/index.js';
import type { Sale, SaleWithItem } from '../../../shared/types.js';

function getItemCostsSummary(itemId: number): { totalCosts: number } {
  const costRows = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM item_costs WHERE item_id = ?
  `).get(itemId) as { total: number };
  return { totalCosts: Number(costRows.total) || 0 };
}

function buildSaleWithItem(s: any): SaleWithItem {
  const { totalCosts } = getItemCostsSummary(s.item_id);
  const buyPrice = Number(s.buy_price);
  const salePrice = Number(s.sale_price);
  const shippingFee = Number(s.shipping_fee) || 0;
  const totalCost = buyPrice + totalCosts;
  const netIncome = salePrice - shippingFee;
  const profit = netIncome - totalCost;
  const grossMargin = salePrice > 0 ? Math.round((profit / salePrice) * 100) : undefined;

  return {
    id: s.id,
    itemId: s.item_id,
    listingId: s.listing_id,
    platform: s.platform,
    salePrice,
    saleDate: s.sale_date,
    shippingFee,
    buyerInfo: s.buyer_info,
    note: s.note,
    createdAt: s.created_at,
    itemName: s.item_name,
    itemImage: s.item_image,
    buyPrice,
    totalCosts,
    totalCost,
    profit,
    grossMargin,
  };
}

export const getSales = (req: Request, res: Response) => {
  const { platform, itemId, startDate, endDate } = req.query;

  let sql = `
    SELECT s.*, i.name as item_name, i.image as item_image, i.buy_price as buy_price
    FROM sales s
    LEFT JOIN items i ON s.item_id = i.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (platform && platform !== 'all') {
    sql += ' AND s.platform = ?';
    params.push(platform);
  }
  if (itemId) {
    sql += ' AND s.item_id = ?';
    params.push(itemId);
  }
  if (startDate) {
    sql += ' AND s.sale_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND s.sale_date <= ?';
    params.push(endDate);
  }
  sql += ' ORDER BY s.sale_date DESC';

  const sales = db.prepare(sql).all(...params) as any[];
  const result: SaleWithItem[] = sales.map(buildSaleWithItem);

  res.json({
    code: 0,
    message: 'success',
    data: result,
  });
};

export const createSale = (req: Request, res: Response) => {
  const { itemId, listingId, platform, salePrice, saleDate, shippingFee, buyerInfo, note } = req.body;

  if (!itemId || !platform || !salePrice || !saleDate) {
    return res.status(400).json({
      code: 400,
      message: '缺少必要参数',
      data: null,
    });
  }

  const item = db.prepare(`
    SELECT id, name, category, buy_price AS buyPrice, buy_date AS buyDate, image, description, status, created_at AS createdAt, updated_at AS updatedAt
    FROM items WHERE id = ?
  `).get(itemId);
  if (!item) {
    return res.status(404).json({
      code: 404,
      message: '物品不存在',
      data: null,
    });
  }

  const tx = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO sales (item_id, listing_id, platform, sale_price, sale_date, shipping_fee, buyer_info, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      itemId,
      listingId || null,
      platform,
      salePrice,
      saleDate,
      shippingFee || 0,
      buyerInfo || null,
      note || null
    );

    db.prepare("UPDATE items SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(itemId);

    if (listingId) {
      db.prepare("UPDATE listings SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(listingId);
    }

    return result.lastInsertRowid;
  });

  const saleId = tx();

  const sale = db.prepare(`
    SELECT s.*, i.name as item_name, i.image as item_image, i.buy_price as buy_price
    FROM sales s
    LEFT JOIN items i ON s.item_id = i.id
    WHERE s.id = ?
  `).get(saleId) as any;

  res.json({
    code: 0,
    message: '创建成功',
    data: buildSaleWithItem(sale),
  });
};

export const deleteSale = (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare(`
    SELECT id, item_id AS itemId, listing_id AS listingId, platform, sale_price AS salePrice, sale_date AS saleDate, shipping_fee AS shippingFee, buyer_info AS buyerInfo, note, created_at AS createdAt
    FROM sales WHERE id = ?
  `).get(id) as Sale | undefined;

  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '成交记录不存在',
      data: null,
    });
  }

  const itemId = existing.itemId;
  const listingId = existing.listingId;

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM sales WHERE id = ?').run(id);

    const activeListings = db.prepare("SELECT COUNT(*) as count FROM listings WHERE item_id = ? AND status = 'active'").get(itemId) as { count: number };
    if (activeListings.count > 0) {
      db.prepare("UPDATE items SET status = 'listing', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(itemId);
    } else {
      db.prepare("UPDATE items SET status = 'holding', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(itemId);
    }

    if (listingId) {
      db.prepare("UPDATE listings SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(listingId);
    }
  });

  tx();

  res.json({
    code: 0,
    message: '删除成功',
    data: null,
  });
};
