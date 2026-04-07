"use client";
import React, { useEffect, useState } from 'react';
import { formatCurrency, formatNumber } from '@/lib/helpers';

type ReportType = 'inventory' | 'sales' | 'materials' | 'profit';

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('inventory');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadReport(); }, [reportType]);

  async function loadReport() {
    setLoading(true);
    const rows = await fetch(`/api/reports?type=${reportType}`).then(r => r.json());
    setData(rows);
    setLoading(false);
  }

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="tabs tabs-boxed bg-base-200 w-fit">
        {([['inventory', 'موجودی انبار'], ['sales', 'فروش محصولات'], ['materials', 'مواد مصرفی'], ['profit', 'درآمد ماهانه']] as [ReportType, string][]).map(([key, label]) => (
          <a key={key} className={`tab tab-sm ${reportType === key ? 'tab-active' : ''}`} onClick={() => setReportType(key)}>{label}</a>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg text-primary" /></div>
      ) : (
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <div className="overflow-x-auto">
              {reportType === 'inventory' && (
                <table className="table table-zebra table-sm">
                  <thead><tr><th>دسته\u200cبندی</th><th>تعداد آیتم</th><th>مجموع موجودی</th><th>ارزش کل</th></tr></thead>
                  <tbody>
                    {data.map((d, i) => (<tr key={i}><td>{d.category}</td><td>{formatNumber(d.count)}</td><td>{formatNumber(d.total_qty)}</td><td>{formatCurrency(d.total_value)}</td></tr>))}
                  </tbody>
                  <tfoot><tr><td className="font-bold">جمع</td><td>{formatNumber(data.reduce((s: number, d: any) => s + Number(d.count), 0))}</td><td>{formatNumber(data.reduce((s: number, d: any) => s + Number(d.total_qty), 0))}</td><td className="font-bold">{formatCurrency(data.reduce((s: number, d: any) => s + Number(d.total_value), 0))}</td></tr></tfoot>
                </table>
              )}
              {reportType === 'sales' && (
                <table className="table table-zebra table-sm">
                  <thead><tr><th>محصول</th><th>تعداد فروخته\u200cشده</th><th>درآمد</th></tr></thead>
                  <tbody>
                    {data.map((d, i) => (<tr key={i}><td>{d.name}</td><td>{formatNumber(d.sold_qty)}</td><td>{formatCurrency(d.revenue)}</td></tr>))}
                    {data.length === 0 && <tr><td colSpan={3} className="text-center text-base-content/60">فروشی ثبت نشده</td></tr>}
                  </tbody>
                </table>
              )}
              {reportType === 'materials' && (
                <table className="table table-zebra table-sm">
                  <thead><tr><th>ماده</th><th>واحد</th><th>موجودی</th><th>قیمت واحد</th><th>ارزش</th></tr></thead>
                  <tbody>
                    {data.map((d, i) => (<tr key={i}><td>{d.name}</td><td>{d.unit}</td><td>{formatNumber(d.quantity)}</td><td>{formatCurrency(d.price)}</td><td>{formatCurrency(d.total_value)}</td></tr>))}
                  </tbody>
                  <tfoot><tr><td colSpan={4} className="font-bold">جمع ارزش مواد</td><td className="font-bold">{formatCurrency(data.reduce((s: number, d: any) => s + Number(d.total_value), 0))}</td></tr></tfoot>
                </table>
              )}
              {reportType === 'profit' && (
                <table className="table table-zebra table-sm">
                  <thead><tr><th>ماه</th><th>درآمد</th><th>وصول شده</th><th>مانده</th></tr></thead>
                  <tbody>
                    {data.map((d, i) => (<tr key={i}><td>{d.month}</td><td>{formatCurrency(d.revenue)}</td><td>{formatCurrency(d.collected)}</td><td className="text-error">{formatCurrency(d.revenue - d.collected)}</td></tr>))}
                    {data.length === 0 && <tr><td colSpan={4} className="text-center text-base-content/60">داده\u200cای موجود نیست</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
