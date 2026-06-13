'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Download, Calendar, BarChart3, Package,
  ShoppingCart, Layers, TrendingUp, DollarSign
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatCurrency, formatNumber, formatDate, exportToCSV } from '@/lib/helpers';

type ReportType = 'inventory' | 'sales' | 'materials' | 'profit' | 'expenses';

interface ReportTab {
  key: ReportType;
  label: string;
  icon: React.ElementType;
}

const reportTabs: ReportTab[] = [
  { key: 'inventory', label: 'موجودی', icon: Package },
  { key: 'sales', label: 'فروش', icon: ShoppingCart },
  { key: 'materials', label: 'مواد اولیه', icon: Layers },
  { key: 'profit', label: 'سود و زیان', icon: TrendingUp },
  { key: 'expenses', label: 'مصارف', icon: DollarSign },
];

const csvHeadersMap: Record<ReportType, { key: string; label: string }[]> = {
  inventory: [
    { key: 'category', label: 'دسته‌بندی' },
    { key: 'count', label: 'تعداد نوع' },
    { key: 'total_qty', label: 'موجودی کل' },
    { key: 'total_value', label: 'ارزش کل' },
  ],
  sales: [
    { key: 'name', label: 'محصول' },
    { key: 'sold_qty', label: 'تعداد فروش' },
    { key: 'revenue', label: 'درآمد' },
  ],
  materials: [
    { key: 'name', label: 'نام ماده' },
    { key: 'unit', label: 'واحد' },
    { key: 'quantity', label: 'موجودی' },
    { key: 'price', label: 'قیمت واحد' },
    { key: 'total_value', label: 'ارزش کل' },
  ],
  profit: [
    { key: 'month', label: 'ماه' },
    { key: 'revenue', label: 'درآمد' },
    { key: 'collected', label: 'وصول شده' },
  ],
  expenses: [
    { key: 'category', label: 'دسته‌بندی' },
    { key: 'count', label: 'تعداد' },
    { key: 'total', label: 'مجموع' },
  ],
};

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('inventory');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let url = `/api/reports?type=${reportType}`;
      if ((reportType === 'sales' || reportType === 'expenses') && dateFrom) {
        url += `&from=${dateFrom}`;
      }
      if ((reportType === 'sales' || reportType === 'expenses') && dateTo) {
        url += `&to=${dateTo}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('خطا در دریافت گزارش');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      toastError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      toastError('داده‌ای برای خروجی وجود ندارد');
      return;
    }
    const headers = csvHeadersMap[reportType];
    const filename = `report-${reportType}-${new Date().toISOString().split('T')[0]}`;
    exportToCSV(data, filename, headers);
    success('فایل CSV با موفقیت دانلود شد');
  };

  const handleDateFilter = () => {
    fetchReport();
  };

  const showDateFilter = reportType === 'sales' || reportType === 'expenses';

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-base-content/50">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>داده‌ای یافت نشد</p>
        </div>
      );
    }

    switch (reportType) {
      case 'inventory':
        return renderInventory();
      case 'sales':
        return renderSales();
      case 'materials':
        return renderMaterials();
      case 'profit':
        return renderProfit();
      case 'expenses':
        return renderExpenses();
    }
  };

  const renderInventory = () => {
    const totalQty = data.reduce((s: number, r: any) => s + (r.total_qty || 0), 0);
    const totalValue = data.reduce((s: number, r: any) => s + (r.total_value || 0), 0);
    return (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>دسته‌بندی</th>
              <th>تعداد نوع</th>
              <th>موجودی کل</th>
              <th>ارزش کل</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, idx: number) => (
              <tr key={idx} className="hover animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                <td>{idx + 1}</td>
                <td className="font-medium">{row.category}</td>
                <td>{formatNumber(row.count)}</td>
                <td>{formatNumber(row.total_qty)}</td>
                <td>{formatCurrency(row.total_value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-base-200">
              <td colSpan={3}>مجموع</td>
              <td>{formatNumber(totalQty)}</td>
              <td>{formatCurrency(totalValue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderSales = () => {
    const totalQty = data.reduce((s: number, r: any) => s + (r.sold_qty || 0), 0);
    const totalRevenue = data.reduce((s: number, r: any) => s + (r.revenue || 0), 0);
    return (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>محصول</th>
              <th>تعداد فروش</th>
              <th>درآمد</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, idx: number) => (
              <tr key={idx} className="hover animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                <td>{idx + 1}</td>
                <td className="font-medium">{row.name}</td>
                <td>{formatNumber(row.sold_qty)}</td>
                <td>{formatCurrency(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-base-200">
              <td colSpan={2}>مجموع</td>
              <td>{formatNumber(totalQty)}</td>
              <td>{formatCurrency(totalRevenue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderMaterials = () => {
    const totalValue = data.reduce((s: number, r: any) => s + (r.total_value || 0), 0);
    return (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>نام ماده</th>
              <th>واحد</th>
              <th>موجودی</th>
              <th>قیمت واحد</th>
              <th>ارزش کل</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, idx: number) => (
              <tr key={idx} className="hover animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                <td>{idx + 1}</td>
                <td className="font-medium">{row.name}</td>
                <td>{row.unit}</td>
                <td>{formatNumber(row.quantity)}</td>
                <td>{formatCurrency(row.price)}</td>
                <td>{formatCurrency(row.total_value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-base-200">
              <td colSpan={5}>مجموع ارزش</td>
              <td>{formatCurrency(totalValue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderProfit = () => {
    const totalRevenue = data.reduce((s: number, r: any) => s + (r.revenue || 0), 0);
    const totalCollected = data.reduce((s: number, r: any) => s + (r.collected || 0), 0);
    return (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>ماه</th>
              <th>درآمد</th>
              <th>وصول شده</th>
              <th>تفاوت</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, idx: number) => {
              const diff = (row.revenue || 0) - (row.collected || 0);
              return (
                <tr key={idx} className="hover animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                  <td>{idx + 1}</td>
                  <td className="font-medium">{row.month}</td>
                  <td>{formatCurrency(row.revenue)}</td>
                  <td>{formatCurrency(row.collected)}</td>
                  <td className={diff > 0 ? 'text-warning' : 'text-success'}>
                    {formatCurrency(Math.abs(diff))}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-base-200">
              <td colSpan={2}>مجموع</td>
              <td>{formatCurrency(totalRevenue)}</td>
              <td>{formatCurrency(totalCollected)}</td>
              <td className={totalRevenue - totalCollected > 0 ? 'text-warning' : 'text-success'}>
                {formatCurrency(Math.abs(totalRevenue - totalCollected))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderExpenses = () => {
    const totalExpenses = data.reduce((s: number, r: any) => s + (r.total || 0), 0);
    return (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>دسته‌بندی</th>
              <th>تعداد</th>
              <th>مجموع</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, idx: number) => (
              <tr key={idx} className="hover animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                <td>{idx + 1}</td>
                <td className="font-medium">{row.category}</td>
                <td>{formatNumber(row.count)}</td>
                <td>{formatCurrency(row.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-base-200">
              <td colSpan={3}>مجموع کل مصارف</td>
              <td>{formatCurrency(totalExpenses)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {reportTabs.map(tab => (
          <button
            key={tab.key}
            className={`btn btn-sm gap-2 ${reportType === tab.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setReportType(tab.key)}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Filter + Export */}
      <div className="flex flex-col sm:flex-row gap-3 items-end justify-between">
        {showDateFilter ? (
          <div className="flex gap-2 items-end">
            <div className="form-control">
              <label className="label py-0"><span className="label-text text-xs">از تاریخ</span></label>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label py-0"><span className="label-text text-xs">تا تاریخ</span></label>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
            <button className="btn btn-sm btn-outline gap-1" onClick={handleDateFilter}>
              <Calendar className="w-3 h-3" />
              فیلتر
            </button>
          </div>
        ) : (
          <div />
        )}
        <button className="btn btn-sm btn-success gap-2" onClick={handleExport} disabled={data.length === 0}>
          <Download className="w-4 h-4" />
          خروجی CSV
        </button>
      </div>

      {/* Report Table */}
      <div className="card bg-base-100 shadow-md animate-fade-in">
        <div className="card-body p-0">
          <div className="flex items-center gap-2 p-4 pb-0">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-bold">
              گزارش {reportTabs.find(t => t.key === reportType)?.label}
            </h2>
            <span className="badge badge-ghost badge-sm">{data.length} ردیف</span>
          </div>
          {renderTable()}
        </div>
      </div>
    </div>
  );
}
