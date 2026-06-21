import { Request, Response } from 'express';
import db from '../db/index.js';
import type { Offer, OfferWithDetails, OfferHistory, SaleWithItem } from '../../../shared/types.js';

function buildOfferWithDetails(o: any, includeHistories = true): OfferWithDetails {
  const result: OfferWithDetails = {
    id: o.id,
    listingId: o.listing_id,
    itemId: o.item_id,
    buyerName: o.buyer_name,
    buyerContact: o.buyer_contact,
    offerPrice: Number(o.offer_price),
    currentPrice: Number(o.current_price),
    status: o.status,
    shippingFee: Number(o.shipping_fee) || 0,
    saleId: o.sale_id || undefined,
    note: o.note,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    itemName: o.item_name,
    itemImage: o.item_image,
    listingPrice: Number(o.listing_price),
    platform: o.platform,
  };

  if (includeHistories) {
    const histories = db.prepare(`
      SELECT id, offer_id AS offerId, actor, action, price, comment, created_at AS createdAt
      FROM offer_histories
      WHERE offer_id = ?
      ORDER BY created_at ASC
    `).all(o.id) as OfferHistory[];
    result.histories = histories;
  }

  return result;
}

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

export const getOffers = (req: Request, res: Response) => {
  const { listingId, itemId, status } = req.query;

  let sql = `
    SELECT o.*, i.name as item_name, i.image as item_image, l.price as listing_price, l.platform
    FROM offers o
    LEFT JOIN items i ON o.item_id = i.id
    LEFT JOIN listings l ON o.listing_id = l.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (listingId) {
    sql += ' AND o.listing_id = ?';
    params.push(listingId);
  }
  if (itemId) {
    sql += ' AND o.item_id = ?';
    params.push(itemId);
  }
  if (status && status !== 'all') {
    sql += ' AND o.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY o.created_at DESC';

  const offers = db.prepare(sql).all(...params) as any[];
  const result: OfferWithDetails[] = offers.map((o) => buildOfferWithDetails(o, true));

  res.json({
    code: 0,
    message: 'success',
    data: result,
  });
};

export const getOfferById = (req: Request, res: Response) => {
  const { id } = req.params;

  const offer = db.prepare(`
    SELECT o.*, i.name as item_name, i.image as item_image, l.price as listing_price, l.platform
    FROM offers o
    LEFT JOIN items i ON o.item_id = i.id
    LEFT JOIN listings l ON o.listing_id = l.id
    WHERE o.id = ?
  `).get(id) as any;

  if (!offer) {
    return res.status(404).json({
      code: 404,
      message: '出价记录不存在',
      data: null,
    });
  }

  res.json({
    code: 0,
    message: 'success',
    data: buildOfferWithDetails(offer, true),
  });
};

export const createOffer = (req: Request, res: Response) => {
  const { listingId, buyerName, buyerContact, offerPrice, shippingFee, note } = req.body;

  if (!listingId || !buyerName || !offerPrice) {
    return res.status(400).json({
      code: 400,
      message: '缺少必要参数',
      data: null,
    });
  }

  const listing = db.prepare(`
    SELECT l.*, i.name as item_name, i.image as item_image
    FROM listings l
    LEFT JOIN items i ON l.item_id = i.id
    WHERE l.id = ?
  `).get(listingId) as any;

  if (!listing) {
    return res.status(404).json({
      code: 404,
      message: '挂售记录不存在',
      data: null,
    });
  }

  if (listing.status !== 'active') {
    return res.status(400).json({
      code: 400,
      message: '挂售记录不在活跃状态，无法出价',
      data: null,
    });
  }

  const tx = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO offers (listing_id, item_id, buyer_name, buyer_contact, offer_price, current_price, status, shipping_fee, note)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `);

    const result = stmt.run(
      listingId,
      listing.item_id,
      buyerName,
      buyerContact || null,
      offerPrice,
      offerPrice,
      shippingFee || 0,
      note || null
    );

    const offerId = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO offer_histories (offer_id, actor, action, price, comment)
      VALUES (?, 'buyer', 'offer', ?, ?)
    `).run(offerId, offerPrice, note || null);

    return offerId;
  });

  const offerId = tx();

  const offer = db.prepare(`
    SELECT o.*, i.name as item_name, i.image as item_image, l.price as listing_price, l.platform
    FROM offers o
    LEFT JOIN items i ON o.item_id = i.id
    LEFT JOIN listings l ON o.listing_id = l.id
    WHERE o.id = ?
  `).get(offerId) as any;

  res.json({
    code: 0,
    message: '创建出价成功',
    data: buildOfferWithDetails(offer, true),
  });
};

export const counterOffer = (req: Request, res: Response) => {
  const { id } = req.params;
  const { counterPrice, comment } = req.body;

  if (!counterPrice) {
    return res.status(400).json({
      code: 400,
      message: '缺少还价价格',
      data: null,
    });
  }

  const existing = db.prepare(`
    SELECT id, status FROM offers WHERE id = ?
  `).get(id) as Offer | undefined;

  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '出价记录不存在',
      data: null,
    });
  }

  if (!['pending', 'negotiating'].includes(existing.status)) {
    return res.status(400).json({
      code: 400,
      message: '当前出价状态不支持还价操作',
      data: null,
    });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE offers
      SET current_price = ?, status = 'negotiating', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(counterPrice, id);

    db.prepare(`
      INSERT INTO offer_histories (offer_id, actor, action, price, comment)
      VALUES (?, 'seller', 'counter', ?, ?)
    `).run(id, counterPrice, comment || null);
  });

  tx();

  const offer = db.prepare(`
    SELECT o.*, i.name as item_name, i.image as item_image, l.price as listing_price, l.platform
    FROM offers o
    LEFT JOIN items i ON o.item_id = i.id
    LEFT JOIN listings l ON o.listing_id = l.id
    WHERE o.id = ?
  `).get(id) as any;

  res.json({
    code: 0,
    message: '还价成功',
    data: buildOfferWithDetails(offer, true),
  });
};

export const acceptOffer = (req: Request, res: Response) => {
  const { id } = req.params;
  const { comment } = req.body;

  const existing = db.prepare(`
    SELECT id, status FROM offers WHERE id = ?
  `).get(id) as Offer | undefined;

  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '出价记录不存在',
      data: null,
    });
  }

  if (!['pending', 'negotiating'].includes(existing.status)) {
    return res.status(400).json({
      code: 400,
      message: '当前出价状态不支持接受操作',
      data: null,
    });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE offers
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    db.prepare(`
      INSERT INTO offer_histories (offer_id, actor, action, comment)
      VALUES (?, 'seller', 'accept', ?)
    `).run(id, comment || null);
  });

  tx();

  const offer = db.prepare(`
    SELECT o.*, i.name as item_name, i.image as item_image, l.price as listing_price, l.platform
    FROM offers o
    LEFT JOIN items i ON o.item_id = i.id
    LEFT JOIN listings l ON o.listing_id = l.id
    WHERE o.id = ?
  `).get(id) as any;

  res.json({
    code: 0,
    message: '接受出价成功',
    data: buildOfferWithDetails(offer, true),
  });
};

export const rejectOffer = (req: Request, res: Response) => {
  const { id } = req.params;
  const { comment } = req.body;

  const existing = db.prepare(`
    SELECT id, status FROM offers WHERE id = ?
  `).get(id) as Offer | undefined;

  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '出价记录不存在',
      data: null,
    });
  }

  if (!['pending', 'negotiating'].includes(existing.status)) {
    return res.status(400).json({
      code: 400,
      message: '当前出价状态不支持拒绝操作',
      data: null,
    });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE offers
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    db.prepare(`
      INSERT INTO offer_histories (offer_id, actor, action, comment)
      VALUES (?, 'seller', 'reject', ?)
    `).run(id, comment || null);
  });

  tx();

  const offer = db.prepare(`
    SELECT o.*, i.name as item_name, i.image as item_image, l.price as listing_price, l.platform
    FROM offers o
    LEFT JOIN items i ON o.item_id = i.id
    LEFT JOIN listings l ON o.listing_id = l.id
    WHERE o.id = ?
  `).get(id) as any;

  res.json({
    code: 0,
    message: '拒绝出价成功',
    data: buildOfferWithDetails(offer, true),
  });
};

export const createSaleFromOffer = (req: Request, res: Response) => {
  const { id } = req.params;
  const { saleDate, shippingFee, note } = req.body;

  const offer = db.prepare(`
    SELECT o.*, l.platform as listing_platform
    FROM offers o
    LEFT JOIN listings l ON o.listing_id = l.id
    WHERE o.id = ?
  `).get(id) as any;

  if (!offer) {
    return res.status(404).json({
      code: 404,
      message: '出价记录不存在',
      data: null,
    });
  }

  if (offer.status !== 'accepted') {
    return res.status(400).json({
      code: 400,
      message: '只有已接受的出价才能生成成交单',
      data: null,
    });
  }

  if (offer.sale_id) {
    return res.status(400).json({
      code: 400,
      message: '该出价已关联成交单，请勿重复生成',
      data: null,
    });
  }

  const item = db.prepare(`
    SELECT id FROM items WHERE id = ?
  `).get(offer.item_id);
  if (!item) {
    return res.status(404).json({
      code: 404,
      message: '物品不存在',
      data: null,
    });
  }

  const finalShippingFee = shippingFee !== undefined ? shippingFee : (offer.shipping_fee || 0);
  const finalSaleDate = saleDate || new Date().toISOString().split('T')[0];
  const buyerInfoParts = [];
  if (offer.buyer_name) buyerInfoParts.push(`买家：${offer.buyer_name}`);
  if (offer.buyer_contact) buyerInfoParts.push(`联系方式：${offer.buyer_contact}`);
  const finalBuyerInfo = buyerInfoParts.length > 0 ? buyerInfoParts.join('；') : null;

  const finalNoteParts = [];
  if (note) finalNoteParts.push(note);
  if (offer.note) finalNoteParts.push(`出价备注：${offer.note}`);
  const finalNote = finalNoteParts.length > 0 ? finalNoteParts.join('；') : null;

  const tx = db.transaction(() => {
    const saleStmt = db.prepare(`
      INSERT INTO sales (item_id, listing_id, platform, sale_price, sale_date, shipping_fee, buyer_info, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = saleStmt.run(
      offer.item_id,
      offer.listing_id,
      offer.listing_platform,
      offer.current_price,
      finalSaleDate,
      finalShippingFee,
      finalBuyerInfo,
      finalNote
    );

    const saleId = result.lastInsertRowid;

    db.prepare("UPDATE items SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(offer.item_id);

    db.prepare("UPDATE listings SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(offer.listing_id);

    db.prepare(`
      UPDATE offers
      SET sale_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(saleId, id);

    db.prepare(`
      UPDATE offers
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE listing_id = ? AND id != ? AND status IN ('pending', 'negotiating')
    `).run(offer.listing_id, id);

    const cancelledOfferIds: number[] = db.prepare(`
      SELECT id FROM offers WHERE listing_id = ? AND id != ? AND status = 'cancelled'
    `).all(offer.listing_id, id).map((r: any) => r.id);

    cancelledOfferIds.forEach((cancelledId: number) => {
      db.prepare(`
        INSERT INTO offer_histories (offer_id, actor, action, comment)
        VALUES (?, 'seller', 'cancel', ?)
      `).run(cancelledId, '同挂售已生成成交，自动关闭');
    });

    return saleId;
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
    message: '生成成交单成功',
    data: buildSaleWithItem(sale),
  });
};

export const deleteOffer = (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare(`
    SELECT id FROM offers WHERE id = ?
  `).get(id) as Offer | undefined;

  if (!existing) {
    return res.status(404).json({
      code: 404,
      message: '出价记录不存在',
      data: null,
    });
  }

  db.prepare('DELETE FROM offers WHERE id = ?').run(id);

  res.json({
    code: 0,
    message: '删除成功',
    data: null,
  });
};
