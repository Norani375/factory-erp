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
  await db.execute({
    sql: 'UPDATE customers SET balance = balance - ? WHERE id = ?',
    args: [amount, customer_id],
  });
  return NextResponse.json({ ok: true });
}
