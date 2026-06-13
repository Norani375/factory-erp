'use client';

import { useState, useEffect } from 'react';
import {
  Package, Layers, Box, Users, ShoppingCart, TrendingUp,
  TrendingDown, DollarSign, AlertTriangle, BarChart3
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatCurrency, formatNumber } from '@/lib/helpers';

interface LowStockProduct {
  name: string;
  quantity: number;
}

interface CategorySale {
  category: string;
  total: number;
}

interface TopProduct {
  name: string;
  qty: number;
}

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
  lowStockProducts: LowStockProduct[];
  categorySales: CategorySale[];
  topProducts: TopProduct[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { error: toastError } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('خطا در دریافت آمار');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      toastError(err.message || 'خطا در دریافت آمار');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="alert alert-error">
        <AlertTriangle className="w-5 h-5" />
        <span>خطا در بارگذاری داشبورد</span>
        <button className="btn btn-sm btn-ghost" onClick={fetchStats}>تلاش مجدد</button>
      </div>
    );
  }

  const profit = stats.totalSalesMonth - stats.totalExpensesMonth;
  const maxCategorySale = stats.categorySales.length > 0
    ? Math.max(...stats.categorySales.map(c => c.total))
    : 1;

  const statCards = [
    { title: 'ارزش کل موجودی', value: formatCurrency(stats.totalInventoryValue), icon: Package, color: 'primary' },
    { title: 'ارزش محصولات', value: formatCurrency(stats.totalProductsValue), icon: Box, color: 'success' },
    { title: 'ارزش مواد', value: formatCurrency(stats.totalMaterialsValue), icon: Layers, color: 'info' },
    { title: 'مشتریان', value: formatNumber(stats.totalCustomers), icon: Users, color: 'secondary' },
    { title: 'فروش امروز', value: formatCurrency(stats.totalSalesToday), icon: ShoppingCart, color: 'warning' },
    { title: 'فروش ماه', value: formatCurrency(stats.totalSalesMonth), icon: TrendingUp, color: 'accent' },
    { title: 'مصارف ماه', value: formatCurrency(stats.totalExpensesMonth), icon: TrendingDown, color: 'error' },
    { title: 'سود/زیان ماه', value: formatCurrency(Math.abs(profit)), icon: DollarSign, color: profit >= 0 ? 'success' : 'error' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`card bg-base-100 shadow-md border-t-4 border-${card.color} animate-fade-in`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-base-content/60 mb-1">{card.title}</p>
                  <p className={`text-xl font-bold text-${card.color}`}>
                    {card.value}
                    {card.title === 'سود/زیان ماه' && (
                      <span className="text-xs font-normal mr-1">
                        {profit >= 0 ? '(سود)' : '(زیان)'}
                      </span>
                    )}
                  </p>
                </div>
                <div className={`p-2 rounded-lg bg-${card.color}/10`}>
                  <card.icon className={`w-6 h-6 text-${card.color}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Debt Alert */}
      {stats.totalDebt > 0 && (
        <div className="alert alert-warning shadow-md animate-fade-in">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <h3 className="font-bold">هشدار بدهی</h3>
            <p>مجموع بدهی مشتریان: {formatCurrency(stats.totalDebt)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Sales Chart */}
        <div className="card bg-base-100 shadow-md animate-fade-in">
          <div className="card-body">
            <h2 className="card-title text-base">
              <BarChart3 className="w-5 h-5 text-primary" />
              فروش بر اساس دسته‌بندی
            </h2>
            {stats.categorySales.length === 0 ? (
              <p className="text-sm text-base-content/60 text-center py-4">داده‌ای موجود نیست</p>
            ) : (
              <div className="space-y-3 mt-2">
                {stats.categorySales.map((cat, idx) => {
                  const widthPercent = maxCategorySale > 0 ? (cat.total / maxCategorySale) * 100 : 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-base-content/70">{formatCurrency(cat.total)}</span>
                      </div>
                      <div className="w-full bg-base-200 rounded-full h-5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-primary to-primary/60 transition-all duration-700"
                          style={{ width: `${Math.max(widthPercent, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card bg-base-100 shadow-md animate-fade-in">
          <div className="card-body">
            <h2 className="card-title text-base">
              <TrendingUp className="w-5 h-5 text-success" />
              محصولات پرفروش
            </h2>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-base-content/60 text-center py-4">داده‌ای موجود نیست</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>محصول</th>
                      <th>تعداد فروش</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topProducts.map((p, idx) => (
                      <tr key={idx} className="hover">
                        <td>
                          <span className={`badge badge-sm ${idx === 0 ? 'badge-warning' : idx === 1 ? 'badge-secondary' : 'badge-ghost'}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="font-medium">{p.name}</td>
                        <td>{formatNumber(p.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Products */}
      {stats.lowStockProducts.length > 0 && (
        <div className="card bg-base-100 shadow-md animate-fade-in">
          <div className="card-body">
            <h2 className="card-title text-base">
              <AlertTriangle className="w-5 h-5 text-warning" />
              محصولات با موجودی کم
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>محصول</th>
                    <th>موجودی</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lowStockProducts.map((p, idx) => (
                    <tr key={idx} className="hover">
                      <td className="font-medium">{p.name}</td>
                      <td>{formatNumber(p.quantity)}</td>
                      <td>
                        <span className={`badge badge-sm ${p.quantity === 0 ? 'badge-error' : 'badge-warning'}`}>
                          {p.quantity === 0 ? 'تمام شده' : 'کم'}
                        </span>
                      </td>
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
