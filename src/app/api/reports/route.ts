import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'inventory';
  let result;

  switch (type) {
    case 'inventory':
      result = await db.execute(`
        SELECT category, COUNT(*) as count, SUM(quantity) as total_qty, SUM(quantity * price) as total_value
        FROM products GROUP BY category ORDER BY total_value DESC
      `);
      break;
    case 'sales':
      result = await db.execute(`
        SELECT p.name, SUM(ii.quantity) as sold_qty, SUM(ii.total) as revenue
        FROM invoice_items ii JOIN products p ON p.id = ii.product_id
        GROUP BY p.name ORDER BY revenue DESC LIMIT 20
      `);
      break;
    case 'materials':
      result = await db.execute(`
        SELECT name, unit, quantity, price, (quantity * price) as total_value
        FROM materials ORDER BY total_value DESC
      `);
      break;
    case 'profit':
      result = await db.execute(`
        SELECT substr(created_at, 1, 7) as month,
          SUM(total - discount) as revenue, SUM(paid) as collected
        FROM invoices GROUP BY month ORDER BY month DESC LIMIT 12
      `);
      break;
    default:
      result = { rows: [] };
  }

  return NextResponse.json(result.rows);
}
