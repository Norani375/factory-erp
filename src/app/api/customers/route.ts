import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const result = await db.execute('SELECT * FROM customers ORDER BY name');
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const { name, phone, address, type } = await req.json();
  const result = await db.execute({
    sql: 'INSERT INTO customers (name, phone, address, type) VALUES (?, ?, ?, ?)',
    args: [name, phone || '', address || '', type || 'نقدی'],
  });
  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}

export async function PUT(req: NextRequest) {
  const { id, name, phone, address, type } = await req.json();
  await db.execute({
    sql: 'UPDATE customers SET name=?, phone=?, address=?, type=? WHERE id=?',
    args: [name, phone, address, type, id],
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await db.execute({ sql: 'DELETE FROM customers WHERE id=?', args: [id] });
  return NextResponse.json({ ok: true });
}
