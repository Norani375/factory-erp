"use client";
import React, { useEffect, useState } from 'react';
import { DollarSign, Search, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/helpers';

interface Customer { id: number; name: string; phone: string; balance: number; }
interface Payment { id: number; customer_name?: string; amount: number; method: string; note: string; created_at: string; }

export default function Debts() {
  const [debtors, setDebtors] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showPay, setShowPay] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('نقد');
  const [payNote, setPayNote] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const data = await fetch('/api/payments').then(r => r.json());
    setDebtors(data.debtors);
    setPayments(data.payments);
    setLoading(false);
  }

  async function handlePayment() {
    if (!showPay || payAmount <= 0) return;
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: showPay.id, amount: payAmount, method: payMethod, note: payNote }),
    });
    setShowPay(null); setPayAmount(0); setPayNote('');
    await loadData();
  }

  const filtered = debtors.filter(d => !search || d.name.includes(search));
  const totalDebt = filtered.reduce((s, d) => s + d.balance, 0);

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg text-primary" /></div>;

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex flex-wrap items-center gap-2">
        <label className="input input-bordered input-sm flex items-center gap-2 flex-1 min-w-48">
          <Search className="h-[1em] opacity-50" />
          <input className="grow" placeholder="جستجو بدهکار..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <X className="h-[1em] opacity-50 cursor-pointer" onClick={() => setSearch('')} />}
        </label>
      </div>

      <div className="alert alert-error"><DollarSign size={18} /><span>مجموع بدهی\u200cها: {formatCurrency(totalDebt)}</span></div>

      <div className="card bg-base-200">
        <div className="card-body p-4">
          <h3 className="card-title text-sm">لیست بدهکاران</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead><tr><th>#</th><th>نام</th><th>تلفن</th><th>بدهی</th><th>عملیات</th></tr></thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id}>
                    <td>{i + 1}</td>
                    <td className="font-medium">{d.name}</td>
                    <td className="ltr-num">{d.phone}</td>
                    <td className="text-error font-bold">{formatCurrency(d.balance)}</td>
                    <td>
                      <button className="btn btn-success btn-xs" onClick={() => { setShowPay(d); setPayAmount(d.balance); }}>
                        <DollarSign size={14} /> تسویه
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="text-center text-base-content/60">بدهکاری وجود ندارد 🎉</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body p-4">
          <h3 className="card-title text-sm">تاریخچه پرداخت\u200cها</h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead><tr><th>مشتری</th><th>مبلغ</th><th>روش</th><th>یادداشت</th><th>تاریخ</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{p.customer_name}</td>
                    <td className="text-success">{formatCurrency(p.amount)}</td>
                    <td><span className="badge badge-sm badge-outline">{p.method}</span></td>
                    <td>{p.note}</td>
                    <td>{formatDate(p.created_at)}</td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={5} className="text-center text-base-content/60">پرداختی ثبت نشده</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPay && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold mb-4">ثبت پرداخت - {showPay.name}</h3>
            <p className="text-sm text-base-content/60 mb-3">بدهی فعلی: {formatCurrency(showPay.balance)}</p>
            <div className="space-y-3">
              <input className="input input-bordered w-full input-sm" type="number" placeholder="مبلغ" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} />
              <select className="select select-bordered w-full select-sm" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                <option value="نقد">نقد</option><option value="چک">چک</option><option value="کارت">کارت</option><option value="انتقال بانکی">انتقال بانکی</option>
              </select>
              <input className="input input-bordered w-full input-sm" placeholder="یادداشت (اختیاری)" value={payNote} onChange={e => setPayNote(e.target.value)} />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPay(null)}>انصراف</button>
              <button className="btn btn-success btn-sm" onClick={handlePayment}>ثبت پرداخت</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowPay(null)} />
        </div>
      )}
    </div>
  );
}
