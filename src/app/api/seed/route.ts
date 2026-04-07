import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST() {
  try {
    // Create tables
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

    return NextResponse.json({ ok: true, message: 'Tables created' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
