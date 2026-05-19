import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const prodVal = await db.execute('SELECT COALESCE(SUM(quantity * price), 0) as val FROM products');
  const matVal = await db.execute('SELECT COALESCE(SUM(quantity * price), 0) as val FROM materials');
  const custCount = await db.execute('SELECT COUNT(*) as cnt FROM customers');
  const debtTotal = await db.execute('SELECT COALESCE(SUM(balance), 0) as val FROM customers WHERE balance > 0');

  const today = new Date().toISOString().split('T')[0];
  const salesToday = await db.execute({ sql: "SELECT COALESCE(SUM(total - discount), 0) as val FROM invoices WHERE created_at LIKE ?", args: [today + '%'] });
  const monthStart = today.substring(0, 7);
  const salesMonth = await db.execute({ sql: "SELECT COALESCE(SUM(total - discount), 0) as val FROM invoices WHERE created_at LIKE ?", args: [monthStart + '%'] });

  const expMonth = await db.execute({ sql: "SELECT COALESCE(SUM(amount), 0) as val FROM expenses WHERE expense_date LIKE ?", args: [monthStart + '%'] });
  const expTotal = await db.execute('SELECT COALESCE(SUM(amount), 0) as val FROM expenses');

  const lowStock = await db.execute('SELECT name, quantity FROM products WHERE quantity <= 3 ORDER BY quantity ASC LIMIT 10');
  const catSales = await db.execute(`SELECT p.category, COALESCE(SUM(ii.total), 0) as total FROM invoice_items ii JOIN products p ON p.id = ii.product_id GROUP BY p.category ORDER BY total DESC`);
  const topProds = await db.execute(`SELECT p.name, COALESCE(SUM(ii.quantity), 0) as qty FROM invoice_items ii JOIN products p ON p.id = ii.product_id GROUP BY p.name ORDER BY qty DESC LIMIT 5`);

  const pv = Number(prodVal.rows[0].val);
  const mv = Number(matVal.rows[0].val);

  return NextResponse.json({
    totalProductsValue: pv,
    totalMaterialsValue: mv,
    totalInventoryValue: pv + mv,
    totalCustomers: Number(custCount.rows[0].cnt),
    totalDebt: Number(debtTotal.rows[0].val),
    totalSalesToday: Number(salesToday.rows[0].val),
    totalSalesMonth: Number(salesMonth.rows[0].val),
    totalExpensesMonth: Number(expMonth.rows[0].val),
    totalExpenses: Number(expTotal.rows[0].val),
    lowStockProducts: lowStock.rows,
    categorySales: catSales.rows,
    topProducts: topProds.rows,
  });
}
