"use client";
import React, { useEffect, useState } from 'react';
import { Package, Wrench, Users, AlertTriangle, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/helpers';

interface Stats {
  totalProductsValue: number;
  totalMaterialsValue: number;
  totalInventoryValue: number;
  totalCustomers: number;
  totalDebt: number;
  totalSalesToday: number;
  totalSalesMonth: number;
  totalExpensesMonth: number;
  totalExpenses: number;
  lowStockProducts: { name: string; quantity: number }[];
  categorySales: { category: string; total: number }[];
  topProducts: { name: string; qty: number }[];
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-3 gap-1">
        <div className={`text-${color} opacity-80`}>{icon}</div>
        <p className="text-base-content/60 text-xs">{label}</p>
        <p className="font-bold text-sm">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><span className="loading loading-spinner loading-lg text-primary" /></div>;
  if (!stats) return <div className="alert alert-error">خطا در بارگذاری</div>;

  const profit = stats.totalSalesMonth - stats.totalExpensesMonth;

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<DollarSign />} label="ارزش کل موجودی" value={formatCurrency(stats.totalInventoryValue)} color="primary" />
        <StatCard icon={<Package />} label="ارزش محصولات" value={formatCurrency(stats.totalProductsValue)} color="success" />
        <StatCard icon={<Wrench />} label="ارزش مواد" value={formatCurrency(stats.totalMaterialsValue)} color="info" />
        <StatCard icon={<Users />} label="مشتریان" value={formatNumber(stats.totalCustomers)} color="secondary" />
        <StatCard icon={<TrendingUp />} label="فروش امروز" value={formatCurrency(stats.totalSalesToday)} color="warning" />
        <StatCard icon={<TrendingUp />} label="فروش ماه" value={formatCurrency(stats.totalSalesMonth)} color="accent" />
        <StatCard icon={<Wallet />} label="مصارف ماه" value={formatCurrency(stats.totalExpensesMonth)} color="error" />
        <StatCard icon={<DollarSign />} label="سود/زیان ماه" value={formatCurrency(profit)} color={profit >= 0 ? "success" : "error"} />
      </div>

      {stats.totalDebt > 0 && (
        <div className="alert alert-warning"><AlertTriangle size={18} /><span>بدهی مشتریان: {formatCurrency(stats.totalDebt)}</span></div>
      )}

      {stats.lowStockProducts.length > 0 && (
        <div className="card bg-base-200"><div className="card-body p-4">
          <h3 className="card-title text-sm text-warning">⚠️ موجودی کم (≤ ۳)</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead><tr><th>محصول</th><th>موجودی</th></tr></thead>
              <tbody>{stats.lowStockProducts.map((p, i) => (
                <tr key={i}><td>{p.name}</td><td><span className="badge badge-error badge-sm">{p.quantity}</span></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div></div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats.categorySales.length > 0 && (
          <div className="card bg-base-200"><div className="card-body p-4">
            <h3 className="card-title text-sm">📊 فروش دسته‌بندی</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm"><thead><tr><th>دسته</th><th>درآمد</th></tr></thead>
                <tbody>{stats.categorySales.map((c, i) => (<tr key={i}><td>{c.category}</td><td>{formatCurrency(c.total)}</td></tr>))}</tbody>
              </table>
            </div>
          </div></div>
        )}
        {stats.topProducts.length > 0 && (
          <div className="card bg-base-200"><div className="card-body p-4">
            <h3 className="card-title text-sm">🏆 پرفروش‌ترین</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm"><thead><tr><th>محصول</th><th>تعداد</th></tr></thead>
                <tbody>{stats.topProducts.map((p, i) => (<tr key={i}><td>{p.name}</td><td>{formatNumber(p.qty)}</td></tr>))}</tbody>
              </table>
            </div>
          </div></div>
        )}
      </div>
    </div>
  );
}
