import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const debtors = await db.execute('SELECT * FROM customers WHERE balance > 0 ORDER BY balance DESC');
  const payments = await db.execute(`
    SELECT p.*, c.name as customer_name FROM payments p
    LEFT JOIN customers c ON c.id = p.customer_id
    ORDER BY p.created_at DESC LIMIT 50
  `);
  return NextResponse.json({ debtors: debtors.rows, payments: payments.rows });
}

export async function POST(req: NextRequest) {
  const { customer_id, amount, method, note } = await req.json();
  await db.execute({
    sql: 'INSERT INTO payments (customer_id, amount, method, note) VALUES (?, ?, ?, ?)',
    args: [customer_id, amount, method || 'نقد', note || ''],
  });
  await db.execute({ sql: 'UPDATE customers SET balance = balance - ? WHERE id = ?', args: [amount, customer_id] });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const { id, amount, method, note } = await req.json();
  const old = await db.execute({ sql: 'SELECT * FROM payments WHERE id=?', args: [id] });
  if (old.rows.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const oldPay = old.rows[0] as any;
  const diff = amount - oldPay.amount;
  await db.execute({ sql: 'UPDATE payments SET amount=?, method=?, note=? WHERE id=?', args: [amount, method, note, id] });
  if (diff !== 0) {
    await db.execute({ sql: 'UPDATE customers SET balance = balance - ? WHERE id = ?', args: [diff, oldPay.customer_id] });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const old = await db.execute({ sql: 'SELECT * FROM payments WHERE id=?', args: [id] });
  if (old.rows.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const oldPay = old.rows[0] as any;
  await db.execute({ sql: 'UPDATE customers SET balance = balance + ? WHERE id = ?', args: [oldPay.amount, oldPay.customer_id] });
  await db.execute({ sql: 'DELETE FROM payments WHERE id=?', args: [id] });
  return NextResponse.json({ ok: true });
}
