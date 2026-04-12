"use client";
import React, { useEffect, useState } from 'react';
import { Package, Wrench, Users, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/helpers';

interface Stats {
  totalProductsValue: number;
  totalMaterialsValue: number;
  totalInventoryValue: number;
  totalCustomers: number;
  totalDebt: number;
  totalSalesToday: number;
  totalSalesMonth: number;
  lowStockProducts: { name: string; quantity: number }[];
  categorySales: { category: string; total: number }[];
  topProducts: { name: string; qty: number }[];
}

const cardStyles: Record<string, string> = {
  primary: 'from-sky-50 to-sky-100/50 border-sky-200',
  success: 'from-emerald-50 to-emerald-100/50 border-emerald-200',
  info: 'from-cyan-50 to-cyan-100/50 border-cyan-200',
  secondary: 'from-violet-50 to-violet-100/50 border-violet-200',
  warning: 'from-amber-50 to-amber-100/50 border-amber-200',
  accent: 'from-teal-50 to-teal-100/50 border-teal-200',
};

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={`card bg-gradient-to-br ${cardStyles[color] || ''} border shadow-sm hover:shadow-md transition-all`}>
      <div className="card-body p-4 gap-1">
        <div className={`text-${color}`}>{icon}</div>
        <p className="text-base-content/60 text-xs">{label}</p>
        <p className="font-bold text-base text-base-content">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><span className="loading loading-spinner loading-lg text-primary" /></div>;
  if (!stats) return <div className="alert alert-error">خطا در بارگذاری داده‌ها</div>;

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full bg-gradient-to-br from-slate-50 to-white">
      <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
        📊 داشبورد مدیریت
      </h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard icon={<DollarSign />} label="ارزش کل موجودی" value={formatCurrency(stats.totalInventoryValue)} color="primary" />
        <StatCard icon={<Package />} label="ارزش محصولات" value={formatCurrency(stats.totalProductsValue)} color="success" />
        <StatCard icon={<Wrench />} label="ارزش مواد مصرفی" value={formatCurrency(stats.totalMaterialsValue)} color="info" />
        <StatCard icon={<Users />} label="تعداد مشتریان" value={formatNumber(stats.totalCustomers)} color="secondary" />
        <StatCard icon={<TrendingUp />} label="فروش امروز" value={formatCurrency(stats.totalSalesToday)} color="warning" />
        <StatCard icon={<TrendingUp />} label="فروش این ماه" value={formatCurrency(stats.totalSalesMonth)} color="accent" />
      </div>

      {stats.totalDebt > 0 && (
        <div className="alert bg-amber-50 border border-amber-200 text-amber-800">
          <AlertTriangle size={18} className="text-amber-500" />
          <span>مجموع بدهی مشتریان: {formatCurrency(stats.totalDebt)}</span>
        </div>
      )}

      {stats.lowStockProducts.length > 0 && (
        <div className="card bg-white border border-orange-200 shadow-sm">
          <div className="card-body p-4">
            <h3 className="card-title text-sm text-orange-600">⚠️ محصولات با موجودی کم (≤ ۳)</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead><tr className="bg-orange-50"><th>محصول</th><th>موجودی</th></tr></thead>
                <tbody>
                  {stats.lowStockProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-orange-50/50">
                      <td>{p.name}</td>
                      <td><span className="badge badge-error badge-sm text-white">{p.quantity}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
