import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await db.execute('SELECT * FROM products ORDER BY category, name');
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const { name, category, dimensions, unit, quantity, price } = await req.json();
  const result = await db.execute({
    sql: 'INSERT INTO products (name, category, dimensions, unit, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
    args: [name, category || 'سایر', dimensions || '', unit || 'عدد', quantity || 0, price || 0],
  });
  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}

export async function PUT(req: NextRequest) {
  const { id, name, category, dimensions, unit, quantity, price } = await req.json();
  await db.execute({
    sql: 'UPDATE products SET name=?, category=?, dimensions=?, unit=?, quantity=?, price=? WHERE id=?',
    args: [name, category, dimensions, unit, quantity, price, id],
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await db.execute({ sql: 'DELETE FROM products WHERE id=?', args: [id] });
  return NextResponse.json({ ok: true });
}
