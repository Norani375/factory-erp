import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const result = await db.execute('SELECT * FROM materials ORDER BY name');
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const { name, unit, quantity, price } = await req.json();
  const result = await db.execute({
    sql: 'INSERT INTO materials (name, unit, quantity, price) VALUES (?, ?, ?, ?)',
    args: [name, unit || 'دانه', quantity || 0, price || 0],
  });
  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}

export async function PUT(req: NextRequest) {
  const { id, name, unit, quantity, price } = await req.json();
  await db.execute({
    sql: 'UPDATE materials SET name=?, unit=?, quantity=?, price=? WHERE id=?',
    args: [name, unit, quantity, price, id],
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await db.execute({ sql: 'DELETE FROM materials WHERE id=?', args: [id] });
  return NextResponse.json({ ok: true });
}
