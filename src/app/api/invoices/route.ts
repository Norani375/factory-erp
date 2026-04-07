import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const result = await db.execute(`
    SELECT i.*, c.name as customer_name FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    ORDER BY i.created_at DESC
  `);
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const { customer_id, total, discount, paid, status, items, payMethod } = await req.json();

  const invResult = await db.execute({
    sql: 'INSERT INTO invoices (customer_id, total, discount, paid, status) VALUES (?, ?, ?, ?, ?)',
    args: [customer_id, total, discount || 0, paid || 0, status || 'pending'],
  });
  const invoiceId = Number(invResult.lastInsertRowid);

  // Insert items and reduce stock
  for (const it of items) {
    await db.execute({
      sql: 'INSERT INTO invoice_items (invoice_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
      args: [invoiceId, it.product_id, it.quantity, it.price, it.quantity * it.price],
    });
    await db.execute({
      sql: 'UPDATE products SET quantity = quantity - ? WHERE id = ?',
      args: [it.quantity, it.product_id],
    });
  }

  // Update customer balance
  const remaining = (total - (discount || 0)) - (paid || 0);
  if (remaining > 0) {
    await db.execute({
      sql: 'UPDATE customers SET balance = balance + ? WHERE id = ?',
      args: [remaining, customer_id],
    });
  }

  // Record payment
  if (paid > 0) {
    await db.execute({
      sql: 'INSERT INTO payments (invoice_id, customer_id, amount, method) VALUES (?, ?, ?, ?)',
      args: [invoiceId, customer_id, paid, payMethod || 'نقد'],
    });
  }

  return NextResponse.json({ id: invoiceId });
}
