import db from './index.js';

export function seedData() {
  const count = db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number };
  if (count.count > 0) return;

  const insertItem = db.prepare(`
    INSERT INTO items (name, category, buy_price, buy_date, description, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertUsage = db.prepare(`
    INSERT INTO usage_records (item_id, content, date)
    VALUES (?, ?, ?)
  `);

  const insertListing = db.prepare(`
    INSERT INTO listings (item_id, platform, price, list_date, status, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertSale = db.prepare(`
    INSERT INTO sales (item_id, listing_id, platform, sale_price, sale_date, shipping_fee, buyer_info, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    const item1 = insertItem.run('索尼A7M4相机', '数码产品', 15800, '2024-03-15', '95新，快门次数5000，配24-70镜头', 'holding');
    const item2 = insertItem.run('MacBook Pro 14寸', '数码产品', 12999, '2024-01-20', 'M3芯片，16G+512G，带AppleCare', 'listing');
    const item3 = insertItem.run('任天堂Switch OLED', '游戏设备', 2199, '2023-11-10', '港版，白色，送3个游戏', 'sold');
    const item4 = insertItem.run('宜家双人沙发', '家居家具', 899, '2023-08-05', '深灰色布艺沙发，9成新', 'holding');
    const item5 = insertItem.run('戴森V10吸尘器', '家用电器', 3290, '2023-06-18', '国行正品，配件齐全', 'listing');
    const item6 = insertItem.run('iPad Air 5', '数码产品', 4799, '2024-02-10', '256G，深空灰，带笔', 'holding');
    const item7 = insertItem.run('小米空气净化器4Pro', '家用电器', 1699, '2023-09-01', '除醛除菌，智能联动', 'sold');

    insertUsage.run(item1.lastInsertRowid, '出门旅行拍摄风景', '2024-04-10');
    insertUsage.run(item1.lastInsertRowid, '拍摄产品照片', '2024-05-05');
    insertUsage.run(item4.lastInsertRowid, '朋友来访使用', '2023-10-01');
    insertUsage.run(item6.lastInsertRowid, '日常看视频和阅读', '2024-03-01');

    insertListing.run(item2.lastInsertRowid, 'xianyu', 10500, '2024-05-20', 'active', '不议价，顺丰包邮');
    insertListing.run(item5.lastInsertRowid, 'xianyu', 2000, '2024-06-01', 'active', '自提优先');
    insertListing.run(item5.lastInsertRowid, 'zhuanzhuan', 2100, '2024-06-01', 'active', '平台验机');

    insertSale.run(item3.lastInsertRowid, null, 'xiaohongshu', 1800, '2024-04-15', 25, '北京买家张先生', '面交，很爽快');
    insertSale.run(item7.lastInsertRowid, null, 'xianyu', 1200, '2024-03-20', 0, '上海买家李女士', '快递寄出，买家已签收');
  });

  tx();
}
