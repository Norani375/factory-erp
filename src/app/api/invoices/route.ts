import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

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
  for (const it of items) {
    await db.execute({
      sql: 'INSERT INTO invoice_items (invoice_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
      args: [invoiceId, it.product_id, it.quantity, it.price, it.quantity * it.price],
    });
    await db.execute({ sql: 'UPDATE products SET quantity = quantity - ? WHERE id = ?', args: [it.quantity, it.product_id] });
  }
  const remaining = (total - (discount || 0)) - (paid || 0);
  if (remaining > 0) {
    await db.execute({ sql: 'UPDATE customers SET balance = balance + ? WHERE id = ?', args: [remaining, customer_id] });
  }
  if (paid > 0) {
    await db.execute({
      sql: 'INSERT INTO payments (invoice_id, customer_id, amount, method) VALUES (?, ?, ?, ?)',
      args: [invoiceId, customer_id, paid, payMethod || 'نقد'],
    });
  }
  return NextResponse.json({ id: invoiceId });
}

export async function PUT(req: NextRequest) {
  const { id, discount, paid, status, payMethod } = await req.json();
  const current = await db.execute({ sql: 'SELECT * FROM invoices WHERE id=?', args: [id] });
  if (current.rows.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const inv = current.rows[0] as any;
  const oldRemaining = inv.total - inv.discount - inv.paid;
  const newRemaining = inv.total - (discount ?? inv.discount) - (paid ?? inv.paid);
  const balanceDiff = newRemaining - oldRemaining;
  await db.execute({
    sql: 'UPDATE invoices SET discount=?, paid=?, status=? WHERE id=?',
    args: [discount ?? inv.discount, paid ?? inv.paid, status || inv.status, id],
  });
  if (balanceDiff !== 0) {
    await db.execute({ sql: 'UPDATE customers SET balance = balance + ? WHERE id = ?', args: [balanceDiff, inv.customer_id] });
  }
  const paidDiff = (paid ?? inv.paid) - inv.paid;
  if (paidDiff > 0) {
    await db.execute({
      sql: 'INSERT INTO payments (invoice_id, customer_id, amount, method) VALUES (?, ?, ?, ?)',
      args: [id, inv.customer_id, paidDiff, payMethod || 'نقد'],
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const inv = await db.execute({ sql: 'SELECT * FROM invoices WHERE id=?', args: [id] });
  if (inv.rows.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const invoice = inv.rows[0] as any;
  const items = await db.execute({ sql: 'SELECT * FROM invoice_items WHERE invoice_id=?', args: [id] });
  for (const item of items.rows as any[]) {
    await db.execute({ sql: 'UPDATE products SET quantity = quantity + ? WHERE id = ?', args: [item.quantity, item.product_id] });
  }
  const remaining = invoice.total - invoice.discount - invoice.paid;
  if (remaining > 0) {
    await db.execute({ sql: 'UPDATE customers SET balance = balance - ? WHERE id = ?', args: [remaining, invoice.customer_id] });
  }
  await db.execute({ sql: 'DELETE FROM invoice_items WHERE invoice_id=?', args: [id] });
  await db.execute({ sql: 'DELETE FROM payments WHERE invoice_id=?', args: [id] });
  await db.execute({ sql: 'DELETE FROM invoices WHERE id=?', args: [id] });
  return NextResponse.json({ ok: true });
}
