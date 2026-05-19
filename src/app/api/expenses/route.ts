import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get('month');
  let result;
  if (month) {
    result = await db.execute({ sql: "SELECT * FROM expenses WHERE expense_date LIKE ? ORDER BY expense_date DESC", args: [month + '%'] });
  } else {
    result = await db.execute('SELECT * FROM expenses ORDER BY expense_date DESC');
  }
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const { category, description, amount, payment_method, expense_date, notes } = await req.json();
  if (!description || !amount) return NextResponse.json({ error: 'شرح و مبلغ الزامی است' }, { status: 400 });
  const result = await db.execute({
    sql: `INSERT INTO expenses (category, description, amount, payment_method, expense_date, notes) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [category || 'متفرقه', description, amount, payment_method || 'نقد', expense_date || new Date().toISOString().split('T')[0], notes || ''],
  });
  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}

export async function PUT(req: NextRequest) {
  const { id, category, description, amount, payment_method, expense_date, notes } = await req.json();
  if (!id) return NextResponse.json({ error: 'id الزامی است' }, { status: 400 });
  await db.execute({
    sql: `UPDATE expenses SET category=?, description=?, amount=?, payment_method=?, expense_date=?, notes=? WHERE id=?`,
    args: [category, description, amount, payment_method, expense_date, notes || '', id],
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id الزامی است' }, { status: 400 });
  await db.execute({ sql: 'DELETE FROM expenses WHERE id=?', args: [id] });
  return NextResponse.json({ success: true });
}
