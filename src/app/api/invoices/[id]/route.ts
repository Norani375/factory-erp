import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = await db.execute({
    sql: `SELECT ii.*, p.name as product_name FROM invoice_items ii
          LEFT JOIN products p ON p.id = ii.product_id
          WHERE ii.invoice_id = ?`,
    args: [params.id],
  });
  return NextResponse.json(result.rows);
}
