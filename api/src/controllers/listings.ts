import { Request, Response } from 'express';
import db from '../db/index.js';
import type { Listing, ListingWithItem } from '../../../shared/types.js';

export const getListings = (req: Request, res: Response) => {
  const { platform, status, itemId } = req.query;

  let sql = `
    SELECT l.*, i.name as item_name, i.image as item_image
    FROM listings l
    LEFT JOIN items i ON l.item_id = i.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (platform && platform !== 'all') {
    sql += ' AND l.platform = ?';
    params.push(platform);
  }
  if (status && status !== 'all') {
    sql += ' AND l.status = ?';
    params.push(status);
  }
  if (itemId) {
    sql += ' AND l.item_id = ?';
    params.push(itemId);
  }
  sql += ' ORDER BY l.list_date DESC';

  const listings = db.prepare(sql).all(...params) as any[];
  const result: ListingWithItem[] = listings.map((l) => ({
    id: l.id,
    itemId: l.item_id,
    platform: l.platform,
    price: l.price,
    listDate: l.list_date,
    status: l.status,
    note: l.note,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    itemName: l.item_name,
    itemImage: l.item_image,
  }));

  res.json({
    code: 0,
    message: 'success',
    data: result,
  });
};

export const createListing = (req: Request, res: Response) => {
  const { itemId, platform, price, listDate, note } = req.body;

  if (!itemId || !platform || !price || !listDate) {
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

  const stmt = db.prepare(`
    INSERT INTO listings (item_id, platform, price, list_date, note)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(itemId, platform, price, listDate, note || null);

  if ((item as any).status === 'holding') {
    db.prepare("UPDATE items SET status = 'listing', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(itemId);
  }

  const listing = db.prepare(`
    SELECT l.*, i.name as item_name, i.image as item_image
    FROM listings l
    LEFT JOIN items i ON l.item_id = i.id
    WHERE l.id = ?
  `).get(result.lastInsertRowid) as any;

  res.json({
    code: 0,
    message: '创建成功',
    data: {
      id: listing.id,
      itemId: listing.item_id,
      platform: listing.platform,
      price: listing.price,
      listDate: listing.list_date,
      status: listing.status,
      note: listing.note,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      itemName: listing.item_name,
      itemImage: listing.item_image,
    },
  });
};

export const updateListing = (req: Request, res: Response) => {
  const { id } = req.params;
  const { platform, price, listDate, status, note } = req.body;

  const existing = db.prepare(`
    SELECT id, item_id AS itemId, platform, price, list_date AS listDate, status, note, created_at AS createdAt, updated_at AS updatedAt
    FROM listings WHERE id = ?
  `).get(id) as Listing | undefined;

  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '挂售记录不存在',
      data: null,
    });
  }

  const stmt = db.prepare(`
    UPDATE listings
    SET platform = ?, price = ?, list_date = ?, status = ?, note = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    platform || existing.platform,
    price || existing.price,
    listDate || existing.listDate,
    status || existing.status,
    note !== undefined ? note : existing.note,
    id
  );

  const listing = db.prepare(`
    SELECT l.*, i.name as item_name, i.image as item_image
    FROM listings l
    LEFT JOIN items i ON l.item_id = i.id
    WHERE l.id = ?
  `).get(id) as any;

  res.json({
    code: 0,
    message: '更新成功',
    data: {
      id: listing.id,
      itemId: listing.item_id,
      platform: listing.platform,
      price: listing.price,
      listDate: listing.list_date,
      status: listing.status,
      note: listing.note,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      itemName: listing.item_name,
      itemImage: listing.item_image,
    },
  });
};

export const deleteListing = (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare(`
    SELECT id, item_id AS itemId, platform, price, list_date AS listDate, status, note, created_at AS createdAt, updated_at AS updatedAt
    FROM listings WHERE id = ?
  `).get(id) as Listing | undefined;

  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '挂售记录不存在',
      data: null,
    });
  }

  const itemId = existing.itemId;
  db.prepare('DELETE FROM listings WHERE id = ?').run(id);

  const remainingListings = db.prepare("SELECT COUNT(*) as count FROM listings WHERE item_id = ? AND status = 'active'").get(itemId) as { count: number };
  if (remainingListings.count === 0) {
    const item = db.prepare(`
      SELECT status FROM items WHERE id = ?
    `).get(itemId) as any;
    if (item.status === 'listing') {
      db.prepare("UPDATE items SET status = 'holding', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(itemId);
    }
  }

  res.json({
    code: 0,
    message: '删除成功',
    data: null,
  });
};
