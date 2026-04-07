import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('product_id');
  if (!productId) return NextResponse.json([]);
  const result = await db.execute({
    sql: `SELECT b.*, m.name as material_name, m.unit as material_unit
          FROM bom b LEFT JOIN materials m ON m.id = b.material_id
          WHERE b.product_id = ?`,
    args: [productId],
  });
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const { product_id, material_id, quantity } = await req.json();
  await db.execute({
    sql: 'INSERT INTO bom (product_id, material_id, quantity) VALUES (?, ?, ?)',
    args: [product_id, material_id, quantity],
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await db.execute({ sql: 'DELETE FROM bom WHERE id=?', args: [id] });
  return NextResponse.json({ ok: true });
}
