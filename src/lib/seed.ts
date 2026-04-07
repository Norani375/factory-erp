import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function seed() {
  console.log('Creating tables...');

  await db.execute(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'سایر',
    dimensions TEXT DEFAULT '', unit TEXT DEFAULT 'عدد', quantity INTEGER DEFAULT 0,
    price REAL DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, unit TEXT NOT NULL DEFAULT 'دانه',
    quantity REAL DEFAULT 0, price REAL DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '',
    type TEXT DEFAULT 'نقدی', balance REAL DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, total REAL DEFAULT 0,
    discount REAL DEFAULT 0, paid REAL DEFAULT 0, status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (customer_id) REFERENCES customers(id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER, product_id INTEGER,
    quantity INTEGER DEFAULT 1, price REAL DEFAULT 0, total REAL DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id), FOREIGN KEY (product_id) REFERENCES products(id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER, customer_id INTEGER,
    amount REAL DEFAULT 0, method TEXT DEFAULT 'نقد', note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id), FOREIGN KEY (customer_id) REFERENCES customers(id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS bom (
    id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, material_id INTEGER,
    quantity REAL DEFAULT 0, FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (material_id) REFERENCES materials(id)
  )`);

  // Check if seeded
  const check = await db.execute('SELECT COUNT(*) as cnt FROM products');
  if (Number(check.rows[0].cnt) > 0) {
    console.log('Already seeded. Skipping.');
    return;
  }

  console.log('Seeding products...');
  const products = [
    ['تخته لمونشین 1.83x2.44','تخته','1.83x2.44cm','عدد',63,2200],
    ['تخته لمونشین 1.83x3.66','تخته','1.83x3.66cm','عدد',420,3200],
    ['تخته کاک 3mm','تخته','3mm','عدد',1178,650],
    ['تخته لاسانی 1.83x3.66','تخته','1.83x3.66cm','عدد',12,4300],
    ['تخته اکلاس 2.44x1.22','تخته','2.44x1.22m','عدد',12,3200],
    ['تخته اشپم پلیت خورد 1.83x3.66','تخته','1.83x3.66','عدد',4,1450],
    ['تخته اشپم پلیت کلان 1.83x2.44','تخته','1.83x2.44cm','عدد',2,2500],
    ['تخت خواب 1.50m','تخت خواب','1.50m','عدد',19,4500],
    ['تخت خواب بف 1.20m','تخت خواب','1.20m','عدد',7,3500],
    ['تخت خواب بف 1.50m','تخت خواب','1.50m','عدد',5,4000],
    ['تخت خواب چگدار 1.80m','تخت خواب','1.80m','عدد',2,18000],
    ['میز آرایش کلان فرنیچردار','میز آرایش','','عدد',2,6000],
    ['الماری دومتره','الماری','2m','عدد',3,7000],
    ['میز آرایش خورد','میز آرایش','','عدد',20,1100],
    ['میز آرایش رفکدار','میز آرایش','','عدد',39,1550],
    ['میز آرایش کلان','میز آرایش','','عدد',2,1550],
    ['الماری فلیکلس 2.40x2.40','الماری','2.40x2.40','عدد',4,13000],
    ['الماری فلیکلس 1.20m','الماری','1.20m','عدد',3,4500],
    ['الماری چهارپله 1.20m','الماری','1.20m','عدد',22,4200],
    ['الماری 1.50m','الماری','1.50m','عدد',3,5200],
    ['الماری 1.80 سه پله','الماری','1.80m','عدد',6,7000],
    ['الماری 2.40x4.40','الماری','2.40x4.40','عدد',2,15000],
    ['الماری چقریدار35','الماری','','عدد',2,11000],
    ['الماری 1.70m','الماری','1.70m','عدد',6,3200],
    ['الماری 2x2.5','الماری','2x2.5','عدد',1,8500],
    ['الماری لباس 2.80x2m','الماری','2.80x2m','عدد',1,20000],
    ['شیشه 2.40x1.8m','شیشه','2.40x1.8m','عدد',25,1100],
    ['شیشه 2.25x1.60m','شیشه','2.25x1.60m','عدد',14,1420],
    ['پوم 1.50x1m','پوم','1.50x1m','عدد',30,450],
    ['پوم 8mm استفاده شده','پوم','8mm','لوله',1,3000],
    ['بخمل','بخمل','','توپ',45,600000],
  ];

  for (const [name, cat, dim, unit, qty, price] of products) {
    await db.execute({
      sql: 'INSERT INTO products (name, category, dimensions, unit, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
      args: [name, cat, dim, unit, qty, price],
    });
  }

  console.log('Seeding materials...');
  const materials = [
    ['فیته دبل 4cm','دانه',25,380],['فیته نازک 2cm','دانه',104,180],
    ['دستگیر 15cm بندک دار','قوتی',16,15],['الکوپان طلایی','دانه',12,190],
    ['میخ یک اینج','کارتن',2,2400],['دستگیر پلاستیکی','کارتن',6,750],
    ['کچگ','قوتی',1,70],['انجامه کلان','سیت',25,140],
    ['انجامه خورد','سیت',43,80],['چپ راست چگدار','کارتن',3,3200],
    ['چپ راست ساده','کارتن',4,1600],['چپ راست شیشه','قوتی',3,40],
    ['قلف','کارتن',5,3700],['خرپیچ 50','کارتن',1.5,2200],
    ['خرپیچ 32','قوتی',17,110],['خرپیچ 28','قوتی',5,110],
    ['خرپیچ 19','قوتی',5,110],['مرمی استپلر','قوتی',50,80],
    ['چینل 30','دانه',37,70],['چینل 32','دانه',44,70],
    ['چگ بله','قوتی',2,700],['دستگیر 15cm فولادی','قوتی',14,11],
    ['دستگیر 25cm طلایی','قوتی',8,20],['قیتک اتومات','پاکت',15,650],
    ['لاتو','قوتی',3,750],['خرپیچ 50 سفید','قوتی',15,110],
    ['شیرش دلتا آهن','کارتن',10,3500],['شیرش 20 PVC','کارتن',1,1600],
    ['چسپ دلتا','کارتن',9,1600],['کندکسر','دانه',83,25],
    ['شیرش توفنگچه','دانه',334,90],['شیرش اسپری','کارتن',19,3500],
    ['شیرش اسپری دلتا','کارتن',17,3500],['دیزان سینسی','کارتن',1,15000],
  ];

  for (const [name, unit, qty, price] of materials) {
    await db.execute({
      sql: 'INSERT INTO materials (name, unit, quantity, price) VALUES (?, ?, ?, ?)',
      args: [name, unit, qty, price],
    });
  }

  console.log('Seed completed!');
}

seed().catch(console.error);
